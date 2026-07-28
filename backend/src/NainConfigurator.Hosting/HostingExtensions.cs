using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace NainConfigurator.Hosting;

public static class HostingExtensions
{
    public static TBuilder AddNainConfiguratorDefaults<TBuilder>(
        this TBuilder builder,
        string serviceName)
        where TBuilder : IHostApplicationBuilder
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);

        builder.Configuration[$"{RuntimeOptions.SectionName}:ServiceName"] = serviceName;
        builder.Configuration[$"{RuntimeOptions.SectionName}:EnvironmentName"] =
            builder.Environment.EnvironmentName;

        builder.Logging.ClearProviders();
        builder.Logging.AddJsonConsole(options =>
        {
            options.IncludeScopes = true;
            options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
            options.UseUtcTimestamp = true;
        });

        builder.Services
            .AddOptions<RuntimeOptions>()
            .Bind(builder.Configuration.GetSection(RuntimeOptions.SectionName))
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.ReleaseId),
                "Runtime:ReleaseId is required.")
            .Validate(
                options => string.Equals(
                    options.ServiceName,
                    serviceName,
                    StringComparison.Ordinal),
                "Runtime:ServiceName must match the host composition.")
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.EnvironmentName),
                "Runtime:EnvironmentName is required.")
            .ValidateOnStart();

        return builder;
    }
}
