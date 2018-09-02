using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebWallet.Models;

namespace WebWallet.Helpers
{
    public static class TransactionHelpers
    {

        public static CachedTx MapTx(TxResp tx)
        {
            CachedTx lightTx = new CachedTx();
            lightTx.h = tx.blockIndex;
            if (tx.extra != null)
                lightTx.pk = tx.extra.publicKey;
            lightTx.hs = tx.hash;
            lightTx.ts = tx.timestamp;
            lightTx.pId = tx.paymentId == "0000000000000000000000000000000000000000000000000000000000000000" ? "" : tx.paymentId;
            lightTx.f = tx.fee;
            lightTx.uT = tx.unlockTime;
            lightTx.gI = tx.global_start_index;
            //map signatures
            lightTx.sigs = new List<CachedSignature>();
            if (tx.signatures != null)
            {
                foreach (var sig in tx.signatures)
                {
                    lightTx.sigs.Add(new CachedSignature() { f = sig.first, s = sig.second });
                }
            }
            //map inputs
            lightTx.vi = new List<CachedInput>();
            if (tx.inputs != null)
            {

                foreach (var inp in tx.inputs)
                {
                    var cachedInput = new CachedInput();
                    cachedInput.a = inp.data.amount;
                    if (inp.data != null)
                    {
                        cachedInput.mx = inp.data.mixin;
                        if (inp.data.input != null)
                        {
                            cachedInput.ki = inp.data.input.k_image;
                            cachedInput.Ko = inp.data.input.key_offsets;
                        }
                        if (inp.data.output != null)
                        {
                            cachedInput.oh = inp.data.output.transactionHash;
                            cachedInput.on = inp.data.output.number;
                        }
                    }
                    cachedInput.t = inp.type;
                    lightTx.vi.Add(cachedInput);
                }
                
            }
            //map outputs
            //TODO: remove fusion Tx's from this cache & result
            lightTx.vo = new List<CachedOutput>();
            if (tx.outputs != null)
            {
                foreach (var outp in tx.outputs)
                {
                    var cachedOutput = new CachedOutput();
                    cachedOutput.a = outp.output.amount;
                    cachedOutput.gI = outp.globalIndex;
                    if (outp.output != null)
                    {
                        if (outp.output.target != null)
                        {
                            cachedOutput.t = outp.output.target.type;
                            if (outp.output.target.data != null)
                            {
                                cachedOutput.k = outp.output.target.data.key;
                            }
                        }
                    }
                    lightTx.vo.Add(cachedOutput);
                }
            }
            return lightTx;
        }

    }
}
