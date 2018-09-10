using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace WebWallet.Mining
{
    public static class Extensions
    {
        public static IApplicationBuilder MapSocketManager(this IApplicationBuilder app,PathString path, SocketHandler handler)
        {
            return app.Map(path, (_app) => _app.UseMiddleware<SocketMiddleware>(handler));
        }

        public static IServiceCollection AddSocketManager(this IServiceCollection services)
        {
            services.AddTransient<SocketManager>();

            foreach (var type in Assembly.GetEntryAssembly().ExportedTypes)
            {
                if (type.GetTypeInfo().BaseType == typeof(SocketHandler))
                {
                    services.AddSingleton(type);
                }
            }

            return services;
        }
    }
}
