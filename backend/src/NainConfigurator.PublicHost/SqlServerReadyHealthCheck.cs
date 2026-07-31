using Microsoft.Extensions.Diagnostics.HealthChecks;
using NainConfigurator.Infrastructure.Persistence;

namespace NainConfigurator.PublicHost;

public sealed class SqlServerReadyHealthCheck(
    SqlServerAvailabilityProbe probe)
    : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            bool canConnect =
                await probe.CanConnectAsync(cancellationToken);

            return canConnect
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy(
                    "The SQL Server database is unavailable.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy(
                "The SQL Server database is unavailable.",
                exception);
        }
    }
}
