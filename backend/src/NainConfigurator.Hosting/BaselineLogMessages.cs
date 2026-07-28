using Microsoft.Extensions.Logging;

namespace NainConfigurator.Hosting;

public static partial class BaselineLogMessages
{
    [LoggerMessage(
        EventId = 1000,
        Level = LogLevel.Information,
        Message = "Host started for {ServiceName} in {EnvironmentName} with release {ReleaseId}.")]
    public static partial void HostStarted(
        ILogger logger,
        string serviceName,
        string environmentName,
        string releaseId);

    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Information,
        Message = "Worker baseline is ready.")]
    public static partial void WorkerReady(ILogger logger);
}
