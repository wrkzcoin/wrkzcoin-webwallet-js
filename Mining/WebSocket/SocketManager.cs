using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Net.WebSockets;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using System.Text;
using System.Net;

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
