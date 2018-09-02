using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using WebWallet.Helpers;
using WebWallet.Models;

namespace WebWallet.Controllers
{
    [Route("api/[controller]")]
    public class TxPoolController : Controller
    {
        [HttpGet]
        public JsonResult Index()
        {
            var rawTxs = RpcHelper.RequestJson<TxPoolResp>("f_on_transactions_pool_json", new Dictionary<string, object>()).result.transactions;
            
            List<CachedTx> transactions = new List<CachedTx>();
            if (rawTxs != null)
            {
                foreach (var rawTx in rawTxs)
                {
                    transactions.Add(TransactionHelpers.MapTx(rawTx));
                }
            }
            return new JsonResult(JsonConvert.SerializeObject(transactions));
        }
    }
}