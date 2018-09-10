using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using WebWallet.Helpers;
using WebWallet.Models;

namespace WebWallet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GetHeightController : ControllerBase
    {

        [HttpGet]
        public ContentResult Get()
        {
            return Content((RpcHelper.Request<GetHeightResp>("getheight").Height-1).ToString());
        }
    }
}