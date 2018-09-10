using System;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace WebWallet.Mining
{
    public class SocketMiddleware
    {
        private readonly RequestDelegate _next;
        private SocketHandler _socketHandler { get; set; }

        public SocketMiddleware(RequestDelegate next, SocketHandler webSocketHandler)
        {
            _next = next;
            _socketHandler = webSocketHandler;
        }

        public async Task Invoke(HttpContext context)
        {
            if (!context.WebSockets.IsWebSocketRequest)
                return;

            var socket = await context.WebSockets.AcceptWebSocketAsync();
            await _socketHandler.OnConnected(socket);

            await Receive(socket, async (result, buffer) =>
            {
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    await _socketHandler.ReceiveAsync(socket, result, buffer);
                    return;
                }

                else if (result.MessageType == WebSocketMessageType.Close)
                {
                    await _socketHandler.OnDisconnected(socket);
                    return;
                }

            });

            //TODO - investigate the Kestrel exception thrown when this is the last middleware
            //await _next.Invoke(context);
        }

        private async Task Receive(WebSocket socket, Action<WebSocketReceiveResult, byte[]> handleMessage)
        {
            var buffer = new byte[1024 * 4];

            while (socket.State == WebSocketState.Open)
            {
                var result = await socket.ReceiveAsync(buffer: new ArraySegment<byte>(buffer), cancellationToken: CancellationToken.None);

                handleMessage(result, buffer);
            }
        }
    }
}
