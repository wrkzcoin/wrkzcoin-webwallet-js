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
            lightTx.height = tx.blockIndex;
            if (tx.extra != null)
                lightTx.publicKey = tx.extra.publicKey;
            lightTx.hash = tx.hash;
            lightTx.timestamp = tx.timestamp;
            lightTx.paymentId = tx.paymentId == "0000000000000000000000000000000000000000000000000000000000000000" ? "" : tx.paymentId;
            lightTx.fee = tx.fee;
            lightTx.unlockTime = tx.unlockTime;
            //map inputs
            lightTx.inputs = new List<CachedInput>();
            if (tx.inputs != null)
            {

                foreach (var inp in tx.inputs)
                {
                    var cachedInput = new CachedInput();
                    cachedInput.amount = inp.data.amount;
                    if (inp.data != null)
                    {
                        if (inp.data.input != null)
                        {
                            cachedInput.keyImage = inp.data.input.k_image;
                            if (inp.data.input.amount > 0 && cachedInput.amount == 0)
                                cachedInput.amount = inp.data.input.amount;
                        }
                    }
                    lightTx.inputs.Add(cachedInput);
                }

            }
            //map outputs
            lightTx.outputs = new List<CachedOutput>();
            if (tx.outputs != null)
            {
                int index = 0;
                foreach (var outp in tx.outputs)
                {
                    var cachedOutput = new CachedOutput();
                    cachedOutput.amount = outp.output.amount;
                    cachedOutput.globalIndex = outp.globalIndex;
                    cachedOutput.index = index;
                    if (outp.output != null)
                    {
                        if (outp.output.target != null)
                        {
                            if (outp.output.target.data != null)
                            {
                                cachedOutput.key = outp.output.target.data.key;
                            }
                        }
                    }
                    lightTx.outputs.Add(cachedOutput);
                    index++;
                }
            }
            return lightTx;
        }

        public static List<LightTx> MapTxs(List<CachedTx> txs) {
            List<LightTx> outs = new List<LightTx>();
            foreach (var tx in txs) {
                outs.Add(MapTx(tx));
            }
            return outs;
        }

        public static LightTx MapTx(CachedTx tx)
        {
            LightTx lightTx = new LightTx();
            lightTx.publicKey = tx.publicKey;
            lightTx.hash = tx.hash;
            lightTx.height = tx.height;
            //map outputs
            lightTx.outputs = new List<LightOutput>();
            if (tx.outputs != null)
            {
                foreach (var outp in tx.outputs)
                {
                    var lightOutput = new LightOutput();
                    lightOutput.key = outp.key;
                    lightTx.outputs.Add(lightOutput);
                }
            }
            return lightTx;
        }

    }
}
