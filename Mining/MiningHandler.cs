using System;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
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
