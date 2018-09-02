using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebWallet.Models
{
    public class CachedTx
    {
        public int Id { get; set; } //required for BSON storage
        public int h { get; set; } //height
        public string hs { get; set; } //height
        public int ts { get; set; } //timestamp
        public string pId { get; set; } //paymentId
        public Int64 f { get; set; } //fee
        public int uT { get; set; } //unlock time
        public int gI { get; set; } //global_index_start
        public string pk { get; set; }
        public List<CachedInput> vi { get; set; } //inputs
        public List<CachedOutput> vo { get; set; } //outputs
        public List<CachedSignature> sigs { get; set; }
    }

    public class CachedInput
    {
        public Int64 a { get; set; } //amount
        public string t { get; set; } //type
        public string ki { get; set; } //k_image
        public List<int> Ko { get; set; } //key_offsets
        public int mx { get; set; } //mixin
        public int on { get; set; } //output.number
        public string oh { get; set; } //output.hash
    }
    public class CachedOutput
    {
        public int gI { get; set; } //global_index
        public Int64 a { get; set; } //amount
        public string t { get; set; } //type
        public string k { get; set; } //key
    }

    public class CachedSignature{
        public int f { get; set; } //first
        public string s { get; set; } //first
    }
}
