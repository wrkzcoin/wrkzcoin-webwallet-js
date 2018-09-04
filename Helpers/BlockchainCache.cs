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
                int outCount = 0;
                var transactions = db.GetCollection<CachedTx>("cached_txs");
                //var rawDb = new LiteDatabase(string.Concat(AppContext.BaseDirectory, @"App_Data\", "raw-blockchain.db"));
                //var rawtransactions = rawDb.GetCollection<TxBlockResp>("rawblockchain");

                var date = DateTime.Now;
                //what if the process dies half way through - we 
                // Index document using height's, hash and Id
                transactions.EnsureIndex(x => x.height);
                transactions.EnsureIndex(x => x.Id);
                transactions.EnsureIndex(x => x.hash);
                
                int startHeight = 1;
                var check = System.IO.File.AppendText(string.Concat(AppContext.BaseDirectory, @"App_Data\", "heights.txt"));
                var outMap = System.IO.File.AppendText(string.Concat(AppContext.BaseDirectory, @"App_Data\", "outMap.txt"));
                check.AutoFlush = true;
                try
                {
                    //get the maxTxId
                    var lastTxId = transactions.Max(x => x.Id).AsInt32;
                    var lastTx = transactions.FindOne(x => x.Id == lastTxId);
                    if (lastTx != null)
                    {
                        startHeight = lastTx.height;
                        outCount = lastTx.global_index_start + lastTx.vout.Count;
                    }
                    else
                    {
                        startHeight = 0;
                        outCount = 0;
                    }
                }
                catch (Exception ex)
                {
                    //todo: add logging
                }

                if (startHeight == 0)
                {
                    startHeight = 1;
                }

                //get bc height from RPC
                var currentHeight = RpcHelper.Request<GetHeightResp>("getheight").Height - 1;

                var counter = 1;
                var gCounter = startHeight + 1;

                var txHashes = new List<string>();

                if (currentHeight > startHeight)
                {
                    //we need to catch the cache up.... 
                    for (var i = startHeight; i <= currentHeight; i++)
                    {
                        //TODO: potential issue with Cache not querying every block
                        check.WriteLine(i);
                        //first, make 100% sure the current height (i) is not already in the cache... 
                        var height_args = new int[] { i };
                        var blockHash = RpcHelper.RequestJson<HashResp>("on_getblockhash", height_args).result;
                        //then, get the blockHash for the height we're currently processing...
                        var hash_args = new Dictionary<string, object>();
                        hash_args.Add("hash", blockHash);
                        txHashes.AddRange(RpcHelper.RequestJson<BlockJsonResp>("f_block_json", hash_args, i).result.block.transactions.Select(x => x.hash).ToList<string>());
                        //next, get the block itself and extract all the tx hashes....

                        if (counter == 50 || gCounter == currentHeight)
                        {
                            var tx_args = new Dictionary<string, object>();
                            tx_args.Add("transactionHashes", txHashes.ToArray());
                            var txs = RpcHelper.Request<TxDetailResp>("get_transaction_details_by_hashes", tx_args, gCounter);
                            foreach (var tx in txs.transactions)
                            {
                                //TODO: find a way to exclude fusion Tx's from the cache
                                var lightTx = TransactionHelpers.MapTx(tx);
                                //persist tx's to cache
                                if (lightTx != null && !transactions.Find(x => x.hash == lightTx.hash).Any())
                                {
                                    //TODO: re-examine this and ensure it's correct
                                    //set the global_index_start for this tx
                                    lightTx.global_index_start = outCount;
                                    outMap.WriteLine(tx.hash + " has global_start_index of " + outCount + " at height " + lightTx.height.ToString());
                                    outCount += lightTx.vout.Count;
                                    transactions.Insert(lightTx);
                                }
                            }
                            counter = 0;
                            txHashes.Clear();
                        }


                        gCounter++;
                        counter++;

                    }

                }
                //else there's nothing to do
                check.Flush();
                check.Close();
            }
            
            //finally, schedule the next check in 30 seconds time
            Thread.Sleep(30000); //using .Schedule" below the jobs dfon't kick off, so reverting to a more crude method... sleep the thred for 30 seconds, then enqueue the job again... 
            BackgroundJob.Schedule(() => BlockchainCache.BuildCache(null), TimeSpan.FromSeconds(30));
        }
    }
}
