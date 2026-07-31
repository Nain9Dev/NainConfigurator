using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace NainConfigurator.Infrastructure.Persistence;

public sealed class NainConfiguratorDesignTimeFactory
    : IDesignTimeDbContextFactory<NainConfiguratorDbContext>
{
    public NainConfiguratorDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<NainConfiguratorDbContext>()
            .UseSqlServer(
                "Server=.\\NAINCONFIGURATOR;Database=NainConfigurator_Local;Integrated Security=true;Encrypt=true;TrustServerCertificate=true",
                sql => sql.MigrationsHistoryTable(
                    "__EFMigrationsHistory",
                    "operations"))
            .Options;

        return new(options);
    }
}
