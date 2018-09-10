using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hangfire;
using Hangfire.Console;
using Hangfire.MemoryStorage;
using Hangfire.LiteDB;
using Hangfire.Server;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WebWallet.Helpers;
using Microsoft.AspNetCore.ResponseCompression;
using WebWallet.Mining;

namespace WebWallet
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            //add Hangfire
            services.AddHangfire(config => {

                config.UseMemoryStorage();
                config.UseConsole();
            });

            //add the websocket service
            services.AddSocketManager();

            //add MVC
            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);
            services.Configure<GzipCompressionProviderOptions>(options =>
                options.Level = System.IO.Compression.CompressionLevel.Optimal
            );
            services.AddResponseCompression(options =>
                options.EnableForHttps = true
            );
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, IServiceProvider serviceProvider)
        {
            //create the data storage directory if it dowsn't exist
            if (!System.IO.Directory.Exists(string.Concat(AppContext.BaseDirectory, "App_Data")))
            {
                System.IO.Directory.CreateDirectory(string.Concat(AppContext.BaseDirectory, "App_Data"));
            }

            //add settings provider
            serviceProvider.ConfigureSettings(Configuration);

            app.UseHangfireServer(new BackgroundJobServerOptions() { ServerName = "web-wallet-api", WorkerCount = 1 });
#if DEBUG
            app.UseHangfireDashboard();
#endif
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseHsts();
            }
            //setup web socket for mining
            app.UseWebSockets();
            app.MapSocketManager("/mining", serviceProvider.GetService<MiningHandler>());

            app.UseResponseCompression();
            app.UseHttpsRedirection();
            app.UseFileServer();

            


            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller}/{action=Index}/{id?}");
            });
            
            //Queue up the caching job
            using (var jobServer = new BackgroundJobServer(new BackgroundJobServerOptions { ServerName = "BackgroundJobServer", WorkerCount = 1 }))
            {
                BackgroundJob.Enqueue(() => BlockchainCache.BuildCache(null));
            }

        }
    }
}
