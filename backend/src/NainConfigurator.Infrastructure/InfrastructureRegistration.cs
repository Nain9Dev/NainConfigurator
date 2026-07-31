using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NainConfigurator.Application;
using NainConfigurator.Infrastructure.Persistence;

namespace NainConfigurator.Infrastructure;

public static class InfrastructureRegistration
{
    public static IServiceCollection AddNainConfiguratorInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        services.AddPooledDbContextFactory<NainConfiguratorDbContext>(
            options =>
            {
                options.UseSqlServer(
                    connectionString,
                    sqlOptions =>
                    {
                        sqlOptions.MigrationsAssembly(
                            typeof(NainConfiguratorDbContext)
                                .Assembly.FullName);
                        sqlOptions.CommandTimeout(30);
                    });
                options.EnableDetailedErrors();
                options.EnableSensitiveDataLogging(false);
            });
        services.AddSingleton<IClock, SystemClock>();
        services.AddSingleton<IPublicCodeGenerator,
            CryptographicPublicCodeGenerator>();
        services.AddSingleton<IPersistenceFaultInjector,
            NoOpPersistenceFaultInjector>();
        services.AddScoped<INainConfiguratorStore,
            SqlNainConfiguratorStore>();
        services.AddScoped<PublicConfigurator>();
        services.AddScoped<TechnicalDemoCatalogSeeder>();
        services.AddSingleton<SqlServerAvailabilityProbe>();

        return services;
    }
}
