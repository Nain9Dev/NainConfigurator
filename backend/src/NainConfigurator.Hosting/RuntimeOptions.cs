namespace NainConfigurator.Hosting;

public sealed class RuntimeOptions
{
    public const string SectionName = "Runtime";

    public string ReleaseId { get; init; } = string.Empty;

    public string ServiceName { get; init; } = string.Empty;

    public string EnvironmentName { get; init; } = string.Empty;
}
