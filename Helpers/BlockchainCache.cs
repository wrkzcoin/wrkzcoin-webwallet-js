using Hangfire;
using Hangfire.Console;
using Hangfire.Server;
using LiteDB;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WebWallet.Models;

namespace WebWallet.Helpers
{
    public static class BlockchainCache
    {
        [AutomaticRetry(Attempts = 0, OnAttemptsExceeded = AttemptsExceededAction.Delete)]
        [DisableConcurrentExecution(30)]
        public static void BuildCache(PerformContext context)
        {
            //retreive, transform and cache the blockchain and store in LiteDB
            //first step is to get the current stored hight from LiteDB...
            //this should all fire synchronously, every 30 seconds so we don't end up with duplicate cached transactions... 

            //temp commented out for multiple db comparison
            using (var db = new LiteDatabase(string.Concat(AppContext.BaseDirectory, @"App_Data\", "transactions.db")))
            {

                var transactions = db.GetCollection<CachedTx>("cached_txs");
                //var rawDb = new LiteDatabase(string.Concat(AppContext.BaseDirectory, @"App_Data\", "raw-blockchain.db"));
                //var rawtransactions = rawDb.GetCollection<TxBlockResp>("rawblockchain");

                var date = DateTime.Now;
                //what if the process dies half way through - we 
                // Index document using height
                transactions.EnsureIndex(x => x.h);
                transactions.EnsureIndex(x => x.hs);
                //rawtransactions.EnsureIndex(x => x.blockIndex);
                int startHeight = 1;
                try
                {
                    startHeight = transactions.Max(x => x.h).AsInt32; //we start with the last block that was processed in case the process died and not all Tx's from that block where cached... 
                    if (startHeight == 0)
                    {
                        startHeight = 1;
                    }
                }
                catch (Exception ex)
                {
                    //todo: add logging
                }
                context.WriteLine("Starting at height: " + startHeight);
                //get bc height from RPC
                var currentHeight = RpcHelper.Request<GetHeightResp>("getheight").Height - 1;

                var counter = 1;
                var gCounter = startHeight + 1;

                var txHashes = new List<string>();

                if (currentHeight > startHeight)
                {
                    //we need to catch the cache up.... 
                    var progress = context.WriteProgressBar();
                    for (var i = startHeight; i <= currentHeight; i++)
                    {
                        progress.SetValue((i / currentHeight * 100));
                        context.WriteLine("retreiving block details: " + i);
                        //first, make 100% sure the current height (i) is not already in the cache... 
                        var height_args = new int[] { i };
                        var blockHash = RpcHelper.RequestJson<HashResp>("on_getblockhash", height_args).result;
                        //then, get the blockHash for the height we're currently processing...
                        var hash_args = new Dictionary<string, object>();
                        hash_args.Add("hash", blockHash);
                        context.WriteLine("block(" + i + ") hash: " + blockHash);

                        txHashes.AddRange(RpcHelper.RequestJson<BlockJsonResp>("f_block_json", hash_args).result.block.transactions.Select(x => x.hash).ToList<string>());
                        context.WriteLine("fetched txs from block(" + i + ")");
                        //next, get the block itself and extract all the tx hashes....

                        if (counter == 50 || gCounter == currentHeight)
                        {
                            context.WriteLine("caching for height :" + gCounter);
                            var tx_args = new Dictionary<string, object>();
                            tx_args.Add("transactionHashes", txHashes.ToArray());
                            var txs = RpcHelper.Request<TxDetailResp>("get_transaction_details_by_hashes", tx_args);

                            foreach (var tx in txs.transactions)
                            {
                                //TODO: find a way to exclude fusion Tx's from the cache
                                var lightTx = TransactionHelpers.MapTx(tx);
                                //persist tx's to cache
                                if (lightTx != null && !transactions.Find(x => x.hs == lightTx.hs).Any())
                                    transactions.Insert(lightTx);
                            }
                            counter = 0;
                            txHashes.Clear();
                        }


                        gCounter++;
                        counter++;

                    }

                }
                //else there's nothing to do
            }
            //finally, schedule the next check in 30 seconds time
            Thread.Sleep(30000); //using .Schedule" below the jobs dfon't kick off, so reverting to a more crude method... sleep the thred for 30 seconds, then enqueue the job again... 
            BackgroundJob.Enqueue(() => BlockchainCache.BuildCache(null));
        }
    }
}
