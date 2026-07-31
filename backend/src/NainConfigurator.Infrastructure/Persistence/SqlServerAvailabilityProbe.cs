using Microsoft.EntityFrameworkCore;

namespace NainConfigurator.Infrastructure.Persistence;

public sealed class SqlServerAvailabilityProbe(
    IDbContextFactory<NainConfiguratorDbContext> contextFactory)
{
    public async Task<bool> CanConnectAsync(
        CancellationToken cancellationToken)
    {
        await using NainConfiguratorDbContext database =
            await contextFactory.CreateDbContextAsync(cancellationToken);
        return await database.Database.CanConnectAsync(cancellationToken);
    }
}
