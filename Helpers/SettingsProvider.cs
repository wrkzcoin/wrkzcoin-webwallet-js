using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebWallet.Helpers
{
    public static class SettingsProvider
    {
        public static string RpcUrl { get; set; }
        public static int RpcPort { get; set; }

        public static IServiceProvider ConfigureSettings(this IServiceProvider serviceProvider, IConfiguration config)
        {
            RpcUrl = config.GetValue<string>("RpcUrl");
            RpcPort = config.GetValue<int>("RpcPort");
            return serviceProvider;
        }
    }
}
