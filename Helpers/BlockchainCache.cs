using Hangfire;
using Hangfire.Console;
using Hangfire.Server;
using LiteDB;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
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
        private static ILogger logger = StaticLogger.CreateLogger("BlockchainChache");

        private static void LogException(Exception ex)
        {
            logger.Log(LogLevel.Error, ex.Message);
            logger.Log(LogLevel.Error, ex.StackTrace);
            if (ex.InnerException != null)
            {
                logger.Log(LogLevel.Error, string.Concat("Inner: ", ex.InnerException.Message));
                logger.Log(LogLevel.Error, ex.InnerException.StackTrace);
            }
        }

        [AutomaticRetry(Attempts = 0, OnAttemptsExceeded = AttemptsExceededAction.Delete)]
        [DisableConcurrentExecution(30)]
        public static void BuildCache(PerformContext context)
        {
            int batchSize = 10;
            try
            {
                //get bc height from RPC
                var currentHeight = 0;
                try
                {
                    currentHeight = RpcHelper.Request<GetHeightResp>("getheight").Height;
                }
                catch
                {
                    currentHeight = 0;
                }
                var startHeight = 1;
                var endHeight = Convert.ToInt32(Math.Ceiling((double)(currentHeight / 10000) * 10000)) + 10000;
                logger.Log(LogLevel.Information, $"Processing transactions from blocks {startHeight} to {endHeight}");
                var clearCache = false;
                var firstPass = true;
                //now, splt the current height into blocks of 10000
                for (int i = startHeight; i <= endHeight; i += 10000)
                {
                    var start = i;
                    var end = i + 10000 - 1;
                    if (clearCache)
                    {
                        if (firstPass) //delete the previous file if we've cought an error
                        {
                            //this file should always exist as it's the one we cought the re-organsisation in
                            System.IO.File.Delete(string.Concat(AppContext.BaseDirectory, @"App_Data/", "transactions_", (start - 10000), "-", (end - 10000), ".db"));
                            firstPass = false;
                        }
                        if (System.IO.File.Exists(string.Concat(AppContext.BaseDirectory, @"App_Data/", "transactions_", start, "-", end, ".db")))
                        {
                            System.IO.File.Delete(string.Concat(AppContext.BaseDirectory, @"App_Data/", "transactions_", start, "-", end, ".db"));
                        }
                        else
                        {
                            //we haven't created this file yet, so we can start to re-cache now... 
                        }
                    }
                    else
                    {
                        //retreive, transform and cache the blockchain and store in LiteDB
                        using (var db = new LiteDatabase(string.Concat(AppContext.BaseDirectory, @"App_Data/", "transactions_", start, "-", end, ".db")))
                        {
                            var transactions = db.GetCollection<CachedTx>("cached_txs");
                            var date = DateTime.Now;
                            // Index document using height's, hash and Id
                            transactions.EnsureIndex(x => x.height);
                            transactions.EnsureIndex(x => x.Id);
                            transactions.EnsureIndex(x => x.hash);

                            try
                            {
                                //get the maxTxId
                                var lastTxId = transactions.Max(x => x.Id).AsInt32;
                                //get the last Tx we cached
                                var lastTx = transactions.FindOne(x => x.Id == lastTxId);
                                if (lastTx != null)
                                {
                                    start = lastTx.height;
                                    var lastHash = lastTx.hash;
                                    if (start == end - 1)
                                    {
                                        logger.Log(LogLevel.Information, $"Already cached transactions from blocks {startHeight} to {endHeight}");
                                        logger.Log(LogLevel.Information, $"Checking for changes to hash '{lastHash}' at height {start}");

                                        //query the node to make sure thew hash at this height still matches the one in the cache... 
                                        List<int> blockHeights = new List<int>();
                                        blockHeights.Add(start);
                                        var args = new Dictionary<string, object>();
                                        args.Add("blockHeights", blockHeights);
                                        var block = RpcHelper.Request<BlockResp>("get_blocks_details_by_heights", args).blocks.FirstOrDefault();
                                        var foundHash = false;
                                        if (block != null)
                                        {
                                            foreach (var transaction in block.transactions)
                                            {
                                                if (transaction.hash == lastTx.hash)
                                                    foundHash = true;
                                            }
                                        }

                                        if (!foundHash)
                                        {
                                            //we have not found the hash in the block, so something has changed...
                                            //set the clearCache var so it deletes previous cache files on the next pass and then re-caches... 
                                            clearCache = true;
                                            logger.Log(LogLevel.Information, $"hash '{lastHash}' not found at height {start}. Recaching...");
                                        }
                                        continue; //continue with the loop to clear the subsequent files... 
                                    }
                                }
                                else
                                {
                                    start = i;
                                }
                            }
                            catch (Exception ex)
                            {
                                LogException(ex);
                            }
                            //TODO: This is Currently re-importing the last 1000 blocks in every batch... need to fix that and add in a checking mechanism to 
                            //get it re-checking cached files... 
                            if (currentHeight > start)
                            {
                                var counter = start;
                                if (end > currentHeight) end = currentHeight;
                                try
                                {
                                    var startBlock = (start / batchSize) * batchSize; //get the first "batch of 1000 to start with
                                    for (var y = startBlock; y <= end; y += batchSize)
                                    {
                                        var endBlock = end < y + batchSize ? end : y + batchSize;
                                        List<int> blockHeights = new List<int>();
                                        for (var x = y; x < endBlock; x++)
                                        {
                                            blockHeights.Add(x);
                                        }
                                        if (blockHeights.Any())
                                        {
                                            //fetch the transactions
                                            var args = new Dictionary<string, object>();
                                            args.Add("blockHeights", blockHeights);
                                            var blocksResponse = RpcHelper.Request<BlockResp>("get_blocks_details_by_heights", args);
                                            if (blocksResponse.blocks != null)
                                            {
                                                List<CachedTx> transactionsToInsert = new List<CachedTx>();
                                                foreach (var block in blocksResponse.blocks)
                                                {
                                                    foreach (var transaction in block.transactions)
                                                    {
                                                        var cachedTx = TransactionHelpers.MapTx(transaction);
                                                        //persist tx's to cache
                                                        if (cachedTx != null && !transactions.Find(x => x.hash == cachedTx.hash).Any())
                                                        {
                                                            transactionsToInsert.Add(cachedTx);
                                                        }
                                                    }

                                                }
                                                if (transactionsToInsert.Any())
                                                {
                                                    transactions.InsertBulk(transactionsToInsert);
                                                }
                                            }
                                            else
                                            {
                                                //try again with a smaller batch size, maybe do these in 10 block batches ?
                                            }
                                        }
                                    }
                                }
                                catch (Exception ex)
                                {
                                    LogException(ex);
                                }

                            }
                            //else there's nothing to do
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                LogException(ex);
            }
            finally
            {
                logger.Log(LogLevel.Information, $"Job Completed, rescheduling...");
                //finally, schedule the next check in 30 seconds time
                BackgroundJob.Schedule(() => BlockchainCache.BuildCache(null), TimeSpan.FromSeconds(30));
            }
        }

        private static CachedTx GetSingleTransaction(string hash)
        {
            var tx_hash = new Dictionary<string, object>();
            tx_hash.Add("transactionHashes", new string[] { hash });
            //now try add the individual hash
            try
            {
                var txs = RpcHelper.Request<TxDetailResp>("get_transaction_details_by_hashes", tx_hash);
                var transactionsToInsert = new List<CachedTx>();
                foreach (var tx in txs.transactions)
                {
                    var cachedTx = TransactionHelpers.MapTx(tx);
                    return cachedTx;
                }
            }
            catch (Exception innerex)
            {
                //FAILED
                logger.LogError($"Failed to add hash: {hash}");
                LogException(innerex);
            }
            return null;
        }
    }
}
