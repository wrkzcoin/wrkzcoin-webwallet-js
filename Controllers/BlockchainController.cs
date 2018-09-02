using LiteDB;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebWallet.Helpers;
using WebWallet.Models;

namespace WebWallet.Controllers
{
    [Route("api/[controller]")]
    public class BlockchainController : ControllerBase
    {

        [HttpGet]
        public JsonResult Get(int height = 0)
        {
            var startHeight = Convert.ToInt32(Math.Floor((double)(height / 100) * 100));
            var endHeight = startHeight + 100;
            if (startHeight < 0) startHeight = 0;
            var chainHeight = RpcHelper.Request<GetHeightResp>("getheight").Height;
            if (chainHeight == 0) chainHeight = endHeight + 100;
            if (endHeight > chainHeight)
                endHeight = chainHeight;
            try
            {
                using (var db = new LiteDatabase(string.Concat(AppContext.BaseDirectory, @"App_Data\", "transactions.db")))
                {
                    var transactions = db.GetCollection<CachedTx>("cached_txs");
                    var txs = transactions.Find(x => x.h >= startHeight && x.h <= endHeight);
                    return new JsonResult(JsonConvert.SerializeObject(txs));
                }
            }
            catch (Exception ex)
            {
                //todo: log and return client handlable exception
            }

            return new JsonResult("");
        }
    }
}
