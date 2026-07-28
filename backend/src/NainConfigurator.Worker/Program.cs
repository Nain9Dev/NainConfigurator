using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NainConfigurator.Hosting;
using NainConfigurator.Worker;

var builder = Host.CreateApplicationBuilder(args);

builder.AddNainConfiguratorDefaults("Worker");
builder.Services.AddHostedService<BaselineWorker>();

using var host = builder.Build();
var runtime = host.Services.GetRequiredService<IOptions<RuntimeOptions>>().Value;

var startupLogger = host.Services
    .GetRequiredService<ILoggerFactory>()
    .CreateLogger("Startup");

BaselineLogMessages.HostStarted(
    startupLogger,
    runtime.ServiceName,
    runtime.EnvironmentName,
    runtime.ReleaseId);

await host.RunAsync();
