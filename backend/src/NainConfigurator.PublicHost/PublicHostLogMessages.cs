namespace NainConfigurator.PublicHost;

internal static partial class PublicHostLogMessages
{
    [LoggerMessage(
        EventId = 2000,
        Level = LogLevel.Error,
        Message = "Unhandled public request failure for trace {TraceId}.")]
    public static partial void UnhandledRequest(
        ILogger logger,
        Exception? exception,
        string traceId);
}
