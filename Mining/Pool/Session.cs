using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace WebWallet.Mining.Pool
{
    public class Session : IDisposable
    {
        private readonly Socket m_socket;
        private readonly WebSocket m_websocket;
        private readonly byte[] m_buffer;

        private bool m_disposed;

        public bool Disposed
        {
            get
            {
                return m_disposed;
            }
        }

        public Action<byte[], int> OnDataReceived { get; set; }
        public Action OnDisconnected { get; set; }

        public string ip;
        public string port;

        public Session(Socket socket)
        {
            m_socket = socket;
            m_buffer = BufferPool.Get();
            m_disposed = false;
        }

        public Session(WebSocket socket)
        {
            m_websocket = socket;
            m_buffer = BufferPool.Get();
            m_disposed = false;
        }

        public void Receive()
        {
            if (m_disposed) { return; }

            SocketError outError = SocketError.Success;
            if (m_socket == null && m_websocket != null)
            {
                //listen for incoming events from the webSocket and pass them on to the Server
                m_websocket.ReceiveAsync(buffer: new ArraySegment<byte>(array: m_buffer, offset: 0, count: m_buffer.Length), cancellationToken: CancellationToken.None);
            }
            else
            {
                //listen for responses from the pool server
                m_socket.BeginReceive(m_buffer, 0, m_buffer.Length, SocketFlags.None, out outError, EndReceive, null);
            }

            if (outError != SocketError.Success)
                Dispose();
        }

        private void EndReceive(IAsyncResult iar)
        {
            //end receive will only ever be called when this is a "to pool" session
            if (m_disposed) { return; }

            SocketError outError;

            int size = m_socket.EndReceive(iar, out outError);

            if (size == 0 || outError != SocketError.Success)
            {
                Dispose();
                return;
            }

            if (OnDataReceived != null)
            {
                var lines = Encoding.UTF8.GetString(m_buffer, 0, size).Split('\n');
                for (int index = 0; index < lines.Length; ++index)
                {
                    if (lines[index].Length > 0)
                        OnDataReceived(Encoding.UTF8.GetBytes(lines[index] + '\n'), lines[index].Length + 1);
                }
            }

            Receive();
        }

        public void Send(byte[] buffer, int length)
        {
            if (m_disposed) { return; }

            int offset = 0;

            while (offset < length)
            {
                SocketError outError = SocketError.Success;

                int size = 0;
                if (m_socket != null) //send to pool server
                    m_socket.Send(buffer, offset, length - offset, SocketFlags.None, out outError);
                else
                {
                    //send to web socket
                    if (m_websocket.State != WebSocketState.Open)
                        return;

                    m_websocket.SendAsync(buffer: new ArraySegment<byte>(array: buffer, offset: 0,count: buffer.Length),
                                           messageType: WebSocketMessageType.Text,
                                           endOfMessage: true,
                                           cancellationToken: CancellationToken.None);
                }

                if (size == 0 || outError != SocketError.Success)
                {
                    Dispose();
                    return;
                }

                offset += size;
            }
        }

        public void Dispose()
        {
            if (!m_disposed)
            {
                m_disposed = true;

                try
                {
                    //TODO: need to close the web sockets here

                    m_socket.Shutdown(SocketShutdown.Both);
                    BufferPool.Put(m_buffer);
                }
                finally
                {
                    m_socket.Close();
                }


                if (OnDisconnected != null)
                    OnDisconnected();

                OnDataReceived = null;
                OnDisconnected = null;
            }
        }
    }
}
