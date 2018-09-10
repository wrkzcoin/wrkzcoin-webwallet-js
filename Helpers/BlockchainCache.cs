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
            using (var db = new LiteDatabase(string.Concat(AppContext.BaseDirectory, @"App_Data\", "transactions.db")))
            {
                var transactions = db.GetCollection<CachedTx>("cached_txs");
                var date = DateTime.Now;
                // Index document using height's, hash and Id
                transactions.EnsureIndex(x => x.height);
                transactions.EnsureIndex(x => x.Id);
                transactions.EnsureIndex(x => x.hash);
                
                int startHeight = 1;
                try
                {
                    //get the maxTxId
                    var lastTxId = transactions.Max(x => x.Id).AsInt32;
                    //get the last Tx we cached
                    var lastTx = transactions.FindOne(x => x.Id == lastTxId);
                    if (lastTx != null)
                    {
                        startHeight = lastTx.height;
                    }
                    else
                    {
                        startHeight = 0;
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
                var currentHeight = 0;
                try
                {
                    currentHeight = RpcHelper.Request<GetHeightResp>("getheight").Height - 1;
                }
                catch {
                    currentHeight = 0;
                }

                var counter = 1;
                var gCounter = startHeight + 1;

                var txHashes = new List<string>();

                if (currentHeight > startHeight)
                {
                    //we need to catch the cache up.... 
                    for (var i = startHeight; i <= currentHeight; i++)
                    {
                        var height_args = new int[] { i };
                        var blockHash = "";
                        try
                        {
                            blockHash = RpcHelper.RequestJson<HashResp>("on_getblockhash", height_args).result;
                        }
                        catch { }
                        if (!string.IsNullOrEmpty(blockHash))
                        {
                            //then, get the blockHash for the height we're currently processing...
                            var hash_args = new Dictionary<string, object>();
                            hash_args.Add("hash", blockHash);
                            txHashes.AddRange(RpcHelper.RequestJson<BlockJsonResp>("f_block_json", hash_args).result.block.transactions.Select(x => x.hash).ToList<string>());
                            //next, get the block itself and extract all the tx hashes....

                            if (counter == 50 || gCounter == currentHeight)
                            {
                                var tx_args = new Dictionary<string, object>();
                                tx_args.Add("transactionHashes", txHashes.ToArray());
                                var txs = RpcHelper.Request<TxDetailResp>("get_transaction_details_by_hashes", tx_args);
                                var transactionsToInsert = new List<CachedTx>();
                                foreach (var tx in txs.transactions)
                                {
                                    var cachedTx = TransactionHelpers.MapTx(tx);
                                    //persist tx's to cache
                                    if (cachedTx != null && !transactions.Find(x => x.hash == cachedTx.hash).Any())
                                    {
                                        transactionsToInsert.Add(cachedTx);
                                    }
                                }
                                if (transactionsToInsert.Any())
                                {
                                    transactions.InsertBulk(transactionsToInsert);
                                }
                                counter = 0;
                                txHashes.Clear();
                            }


                            gCounter++;
                            counter++;
                        }

                    }

                }
                //else there's nothing to do
            }
            
            //finally, schedule the next check in 30 seconds time
            Thread.Sleep(30000); //using .Schedule" below the jobs dfon't kick off, so reverting to a more crude method... sleep the thred for 30 seconds, then enqueue the job again... 
            BackgroundJob.Schedule(() => BlockchainCache.BuildCache(null), TimeSpan.FromSeconds(30));
        }
    }
}
