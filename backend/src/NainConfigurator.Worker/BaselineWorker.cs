using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NainConfigurator.Hosting;

namespace NainConfigurator.Worker;

public sealed class BaselineWorker(ILogger<BaselineWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        BaselineLogMessages.WorkerReady(logger);
        await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
    }
}
