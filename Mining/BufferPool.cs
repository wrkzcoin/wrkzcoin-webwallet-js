using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebWallet.Mining
{
    internal sealed class BufferPool
    {
        public const int BufferSize = 10240;
        private static ConcurrentBag<byte[]> objectPool = new ConcurrentBag<byte[]>();

        public static byte[] Get()
        {
            byte[] buffer;

            if (objectPool.TryTake(out buffer) == false)
                buffer = new byte[BufferSize];

            return buffer;
        }
        public static void Put(byte[] buffer)
        {
            if (buffer == null)
                throw new ArgumentNullException("buffer");

            if (buffer.Length != BufferSize)
                throw new ArgumentOutOfRangeException("buffer");

            Array.Clear(buffer, 0, BufferSize);
            objectPool.Add(buffer);
        }
    }
}
