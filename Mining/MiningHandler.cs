using System;
/*
 * Copyright (c) 2018, The Plenteum Project
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

using System.Net.WebSockets;
using System.Text;
using System.Threading.Tasks;

namespace WebWallet.Mining
{
    public class MiningHandler : SocketHandler
    {
        public MiningHandler(SocketManager socketManager) : base(socketManager)
        {

        }

        public override async Task OnConnected(WebSocket socket)
        {
            //setting up so the connection gets it's own socket Id and we can manage this connection going forward
            await base.OnConnected(socket);
        }

        public override async Task ReceiveAsync(WebSocket socket, WebSocketReceiveResult result, byte[] buffer)
        {
            var socketId = SocketManager.GetWebSocketId(socket);
            var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
            System.IO.File.AppendAllText(string.Concat(AppContext.BaseDirectory, @"App_Data\", "poolmessages.txt"), "From Client " + DateTime.Now +  ": " + message + Environment.NewLine);
            //now, we need to pass that message on to the pool... 
            buffer = Encoding.UTF8.GetBytes(message);
            onConnected.WaitOne(); //wait for the server socket to connect before sending messages to the pool
            PoolSend(buffer);
        }
    }
}
