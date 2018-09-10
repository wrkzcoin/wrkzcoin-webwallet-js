using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebWallet.Models
{

    public class MiningParams
    {
        public string login { get; set; }
        public string pass { get; set; }
        public string agent { get; set; }
        public string id { get; set; }
        public string job_id { get; set; }
        public string nonce { get; set; }
        public string result { get; set; }
    }

    public class MiningRootObject
    {
        public string method { get; set; }
        public MiningParams @params { get; set; }
        public int id { get; set; }
    }

    public class ServerJob
    {
        public string blob { get; set; }
        public string job_id { get; set; }
        public string target { get; set; }
    }

    public class ServerResult
    {
        public string id { get; set; }
        public ServerJob job { get; set; }
        public string status { get; set; }
    }

    public class ServerRootObject
    {
        public int id { get; set; }
        public string jsonrpc { get; set; }
        public object error { get; set; }
        public string method { get; set; }
        public ServerResult result { get; set; }
    }
}
