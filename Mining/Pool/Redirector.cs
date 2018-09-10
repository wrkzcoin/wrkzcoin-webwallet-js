using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Threading.Tasks;
using WebWallet.Models;

namespace WebWallet.Mining.Pool
{
    public class Redirector : IDisposable
    {
        internal Session m_client, m_server;
        internal dynamic m_coinHandler;
        internal bool m_changingServers;
        internal byte[] m_loginBuffer;
        internal int m_loginLength;

        public Action OnConnected { get; set; }

        public Redirector(WebSocket client, string poolServer, int port)
        {
            m_client = new Session(client); //this is our client listening for responses from the pool
            m_client.OnDataReceived = OnClientPacket;
            m_client.OnDisconnected = Dispose;

            var outSocket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            outSocket.BeginConnect(poolServer, port, EndConnect, outSocket);
        }

        private void EndConnect(IAsyncResult iar)
        {
            try
            {
                var outSocket = iar.AsyncState as Socket;

                outSocket.EndConnect(iar);
                IPEndPoint remoteEndPoint = outSocket.RemoteEndPoint as IPEndPoint;

                m_server = new Session(outSocket);
                m_server.OnDataReceived = OnServerPacket;
                m_server.OnDisconnected = Dispose;
                m_server.ip = remoteEndPoint.Address.ToString();
                m_server.port = remoteEndPoint.Port.ToString();
                m_server.Receive();
                //raise event to notify MiddleWare that it's receiving... 

                m_client.Receive();
            }
            catch (SocketException se)
            {
                m_client.Dispose();
            }
        }

        public void Dispose()
        {
            if (m_client != null)
                m_client.Dispose();

            if (m_server != null)
                m_server.Dispose();
        }
        //received data from the browser
        internal void OnClientPacket(byte[] buffer, int length)
        {
            bool madeChanges = false;
            byte[] newBuffer = null;
            int newLength = 0;

            try   //try to deserialize the packet, if it's not Json it will fail. that's ok.
            {
                MiningRootObject obj;
                obj = JsonConvert.DeserializeObject<MiningRootObject>(Encoding.UTF8.GetString(buffer, 0, length));
                switch (obj.id)
                {

                    case 1: //pool login
                        if (!string.IsNullOrEmpty(obj.@params.login))
                        {
                            string tempBuffer = JsonConvert.SerializeObject(obj, Formatting.None) + "\n";
                            newBuffer = Encoding.UTF8.GetBytes(tempBuffer);
                            newLength = tempBuffer.Length;
                            madeChanges = true;
                        }
                        break;
                }
            }
            catch (Exception ex)
            {
                madeChanges = false;
            }

            if (m_server.Disposed == false)
            {
                if (madeChanges == false)
                {
                    m_server.Send(buffer, length);
                }
                else
                {
                    m_server.Send(newBuffer, newLength);
                }
            }
        }

        //received data from the pool
        internal void OnServerPacket(byte[] buffer, int length)
        {
            if (m_client.Disposed == false)
                m_client.Send(buffer, length);
        }

    }
}
