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


using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Net.WebSockets;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;

namespace WebWallet.Mining
{
    public class SocketManager
    {
        private ConcurrentDictionary<string, WebSocket> _socketsIn = new ConcurrentDictionary<string, WebSocket>();
        private ConcurrentDictionary<string, Socket> _socketsOut = new ConcurrentDictionary<string, Socket>();

        public WebSocket GetWebSocketById(string id)
        {
            return _socketsIn.FirstOrDefault(p => p.Key == id).Value;
        }

        public Socket GetSocketById(string id)
        {
            return _socketsOut.FirstOrDefault(p => p.Key == id).Value;
        }

        public ConcurrentDictionary<string, WebSocket> GetAllWebSockets()
        {
            return _socketsIn;
        }
        public string GetWebSocketId(WebSocket socket)
        {
            return _socketsIn.FirstOrDefault(p => p.Value == socket).Key;
        }

        public string GetSocketId(Socket socket)
        {
            return _socketsOut.FirstOrDefault(p => p.Value == socket).Key;
        }

        public string AddWebSocket(WebSocket _socketIn)
        {
            var guid = CreateConnectionId();
            var added = _socketsIn.TryAdd(guid, _socketIn);
            if (added)
                return guid;

            return ""; //return a blank string if the web socket was not added to the Concurrent Dictionary
        }

        public bool AddSocket(string socketId, Socket _socketOut)
        {
            //first, try to remove the out bound socket if it's already in here as we may be re-adding it
            Socket tempSocket;
            _socketsOut.TryRemove(socketId, out tempSocket);
            if (tempSocket != null)
            {
                tempSocket.Dispose(); //dispose the previous one, .... 
            }

            return _socketsOut.TryAdd(socketId, _socketOut);
        }

        public async Task RemoveSocket(string id)
        {
            //TODO: remove the server socket and shut it down

            //close the web socket
            WebSocket _socketIn;
            _socketsIn.TryRemove(id, out _socketIn);

            await _socketIn.CloseAsync(closeStatus: WebSocketCloseStatus.NormalClosure,
                                    statusDescription: "Closed by the WebSocketManager",
                                    cancellationToken: CancellationToken.None);
        }

        private string CreateConnectionId()
        {
            return Guid.NewGuid().ToString();
        }

    }
}
