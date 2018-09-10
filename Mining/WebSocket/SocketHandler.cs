using System;
using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace WebWallet.Mining
{
    public abstract class SocketHandler
    {
        protected SocketManager SocketManager { get; set; }
        private string socketId;
        private Socket _socket;
        byte[] buffer;

        protected ManualResetEvent onConnected;

        public SocketHandler(SocketManager webSocketManager)
        {
            buffer = BufferPool.Get();
            SocketManager = webSocketManager;
        }

        public virtual async Task OnConnected(WebSocket _socketIn)
        {
            //first, add the webSocket to the socket Manager and get back the ID we're going to use for this session
            socketId = SocketManager.AddWebSocket(_socketIn);
            if (!string.IsNullOrEmpty(socketId))
            {
                BeginConnect();
            }

        }

        private void BeginConnect()
        {
            //we have a new socket to the pool server, now we need to connect it and add it to the concurrent dictionary
            //setup connection to the server and wait for it to return completed
            _socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            _socket.NoDelay = true;
            _socket.BeginConnect("192.168.1.60", 3333, EndConnect, _socket);
            //create the redirector
            onConnected = new ManualResetEvent(false);
        }

        public virtual async Task OnDisconnected(WebSocket _socketIn)
        {
            await SocketManager.RemoveSocket(SocketManager.GetWebSocketId(_socketIn));
        }


        //Web Socket Sending back to Browser
        public async Task SendMessageAsync(WebSocket socket, string message)
        {
            if (socket.State != WebSocketState.Open)
                return;

            await socket.SendAsync(buffer: new ArraySegment<byte>(Encoding.ASCII.GetBytes(message), 0, message.Length),
                                   messageType: WebSocketMessageType.Text,
                                   endOfMessage: true,
                                   cancellationToken: CancellationToken.None);
        }

        public async Task SendMessageAsync(string socketId, string message)
        {
            //find the matching socket
            var socket = SocketManager.GetWebSocketById(socketId);
            await SendMessageAsync(socket, message);
        }

        public abstract Task ReceiveAsync(WebSocket socket, WebSocketReceiveResult result, byte[] buffer);

        private void EndConnect(IAsyncResult iar)
        {
            try
            {
                var outSocket = iar.AsyncState as Socket;
                if (outSocket != null)
                {
                    //outSocket.EndConnect(iar);
                    if (outSocket.Connected)
                    {
                        //the socket is connected, so we can now add it to the socket manager and then re use it
                        SocketManager.AddSocket(socketId, outSocket); //add it to the socket manager so we can use this same connection to reply back to the client (browser)
                        onConnected.Set();
                        PoolReceive(); //start receiving
                    }
                }
            }
            catch (SocketException se)
            {
                //TODO: add logging
            }
        }

        private void PoolReceive()
        {

            if (_socket != null)
            {
                SocketError outError = SocketError.Success;
                _socket.BeginReceive(buffer, 0, buffer.Length, SocketFlags.None, out outError, EndPoolReceive, null);
            }
        }

        private void EndPoolReceive(IAsyncResult iar)
        {

            try
            {

                SocketError outError;

                int size = _socket.EndReceive(iar, out outError);

                if (size == 0)
                {
                    PoolReceive(); //keep listening
                    return; //in this instance we just ignore the response.. 
                }

                if (outError != SocketError.Success)
                {
                    PoolReceive(); //keep listening
                    return; //in this instance we just ignore the response.. 
                }

                //pass the received message on to the webSocket to be returned to the client
                var lines = Encoding.UTF8.GetString(buffer, 0, size).Split('\n');
                for (int index = 0; index < lines.Length; ++index)
                {
                    if (lines[index].Length > 0)
                    {
                        SendMessageAsync(socketId, lines[index] + Environment.NewLine);
                    }
                }
            }
            catch (Exception ex)
            {
                //TODO: Add Logging
            }

            PoolReceive(); //keep listening for incoming data from the pool
        }


        public void PoolSend(byte[] buffer)
        {
            try
            {
                var outSocket = SocketManager.GetSocketById(socketId);
                string something = outSocket.RemoteEndPoint.ToString();

                if (!outSocket.Connected)
                {
                    BeginConnect();
                    onConnected.WaitOne();
                }

                if (outSocket != null)
                {
                    string fromClient = Encoding.UTF8.GetString(buffer, 0, buffer.Length);
                    if (fromClient.IndexOf("login") == -1)
                    {
                        //this is not a login request
                        fromClient += "\n"; //this is a requirement of the cryptonote-nodejs-pool software, it will rejet messages that do not contain a "/n" following the JSON
                    }
                    buffer = Encoding.UTF8.GetBytes(fromClient);

                    SocketError outError = SocketError.Success;

                    int size = outSocket.Send(buffer, 0, buffer.Length, SocketFlags.None, out outError);
                    if (size == 0)
                    {
                        return;
                    }
                    if (outError != SocketError.Success)
                    {
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                //TODO: Add Logging
            }

        }
    }
}
