using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebWallet.Models
{
    public class NetworkStats
    {
        public NetworkStatsResult result { get; set; }
    }

    public class NetworkStatsResult {
        public BlockHeader block_header { get; set; }
    }

    public class BlockHeader { 
        /*
         * echo json_encode(array(
			'major_version'=>$blockHeader['major_version'],
			'hash'=>$blockHeader['hash'],
			'reward'=>$blockHeader['reward'],
			'height'=>$blockHeader['height'],
			'timestamp'=>$blockHeader['timestamp'],
			'difficulty'=>$blockHeader['difficulty'],
			'hashrate'=>$blockHeader['difficulty']*60*2,
	));
         */

        public string major_version { get; set; }
        public string hash { get; set; }
        public Int64 reward { get; set; }
        public int height { get; set; }
        public int timestamp { get; set; }
        public Int64 difficulty { get; set; }
        public string hashrate { get; set; }
    }
}
