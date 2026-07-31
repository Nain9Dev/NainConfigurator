using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NainConfigurator.Infrastructure;
using NainConfigurator.Infrastructure.Persistence;

return await DatabaseMigratorProgram.RunAsync(args);

internal static class DatabaseMigratorProgram
{
    private const string DefaultConnectionString =
        "Server=.\\NAINCONFIGURATOR;" +
        "Database=NainConfigurator_Demo;" +
        "Integrated Security=True;" +
        "Encrypt=True;" +
        "TrustServerCertificate=True;" +
        "Application Name=NainConfigurator.DatabaseMigrator;" +
        "Connect Timeout=15;";

    private static readonly HashSet<string> AllowedDatabaseNames =
        new(StringComparer.Ordinal)
        {
            "NainConfigurator_Local",
            "NainConfigurator_Integration",
            "NainConfigurator_Demo",
        };

    public static async Task<int> RunAsync(string[] args)
    {
        try
        {
            MigratorOptions options = MigratorOptions.Parse(args);
            string connectionString =
                Environment.GetEnvironmentVariable(
                    "NAINCONFIGURATOR_SQL_CONNECTION")
                ?? DefaultConnectionString;
            var targetBuilder =
                new SqlConnectionStringBuilder(connectionString);

            if (!AllowedDatabaseNames.Contains(targetBuilder.InitialCatalog))
            {
                throw new InvalidOperationException(
                    "The target database is not in the local non-production allowlist.");
            }

            if (options.Reset)
            {
                RequireResetAuthorization();
            }

            await EnsureDatabaseAsync(
                targetBuilder,
                options.Reset,
                CancellationToken.None);

            var services = new ServiceCollection();
            services.AddNainConfiguratorInfrastructure(
                targetBuilder.ConnectionString);

            await using ServiceProvider provider =
                services.BuildServiceProvider();
            IDbContextFactory<NainConfiguratorDbContext> contextFactory =
                provider.GetRequiredService<
                    IDbContextFactory<NainConfiguratorDbContext>>();

            await using (NainConfiguratorDbContext context =
                         await contextFactory.CreateDbContextAsync())
            {
                await context.Database.MigrateAsync();
            }

            if (!options.MigrateOnly)
            {
                string catalogPath = options.CatalogPath ??
                    Path.Combine(
                        AppContext.BaseDirectory,
                        "demo",
                        "technical-demo-catalogs.json");
                TechnicalDemoCatalogSeeder seeder =
                    provider.GetRequiredService<
                        TechnicalDemoCatalogSeeder>();
                await seeder.SeedAsync(
                    catalogPath,
                    CancellationToken.None);
            }

            Console.WriteLine(
                options.MigrateOnly
                    ? "Local database migration completed."
                    : "Local database migration and synthetic demo seed completed.");

            return 0;
        }
        catch (Exception exception)
        {
            Console.Error.WriteLine(
                $"Database preparation failed: {exception.Message}");
            return 1;
        }
    }

    private static async Task EnsureDatabaseAsync(
        SqlConnectionStringBuilder targetBuilder,
        bool reset,
        CancellationToken cancellationToken)
    {
        string databaseName = targetBuilder.InitialCatalog;
        string quotedDatabaseName = databaseName switch
        {
            "NainConfigurator_Local" => "[NainConfigurator_Local]",
            "NainConfigurator_Integration" =>
                "[NainConfigurator_Integration]",
            "NainConfigurator_Demo" => "[NainConfigurator_Demo]",
            _ => throw new InvalidOperationException(
                "The database name is not approved."),
        };

        var masterBuilder = new SqlConnectionStringBuilder(
            targetBuilder.ConnectionString)
        {
            InitialCatalog = "master",
        };

        await using var connection =
            new SqlConnection(masterBuilder.ConnectionString);
        await connection.OpenAsync(cancellationToken);

        if (reset)
        {
            await using SqlCommand resetCommand = connection.CreateCommand();
            resetCommand.CommandText =
                $"""
                IF DB_ID(N'{databaseName}') IS NOT NULL
                BEGIN
                    ALTER DATABASE {quotedDatabaseName}
                        SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                    DROP DATABASE {quotedDatabaseName};
                END;
                """;
            await resetCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        await using (SqlCommand createCommand = connection.CreateCommand())
        {
            createCommand.CommandText =
                $"""
                IF DB_ID(N'{databaseName}') IS NULL
                BEGIN
                    CREATE DATABASE {quotedDatabaseName}
                        COLLATE Latin1_General_100_CI_AS_SC;
                END;
                """;
            await createCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        await using SqlCommand optionsCommand = connection.CreateCommand();
        optionsCommand.CommandText =
            $"""
            ALTER DATABASE {quotedDatabaseName}
                SET COMPATIBILITY_LEVEL = 170;
            ALTER DATABASE {quotedDatabaseName}
                SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
            ALTER DATABASE {quotedDatabaseName}
                SET ALLOW_SNAPSHOT_ISOLATION ON;
            """;
        await optionsCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    private static void RequireResetAuthorization()
    {
        bool isAuthorized = string.Equals(
            Environment.GetEnvironmentVariable(
                "NAINCONFIGURATOR_ALLOW_DATABASE_RESET"),
            "true",
            StringComparison.OrdinalIgnoreCase);

        if (!isAuthorized)
        {
            throw new InvalidOperationException(
                "Set NAINCONFIGURATOR_ALLOW_DATABASE_RESET=true to reset an allowlisted local database.");
        }
    }

    private sealed record MigratorOptions(
        bool Reset,
        bool MigrateOnly,
        string? CatalogPath)
    {
        public static MigratorOptions Parse(string[] args)
        {
            bool reset = false;
            bool migrateOnly = false;
            string? catalogPath = null;

            for (int index = 0; index < args.Length; index++)
            {
                switch (args[index])
                {
                    case "--reset":
                        reset = true;
                        break;
                    case "--migrate-only":
                        migrateOnly = true;
                        break;
                    case "--catalog"
                        when index + 1 < args.Length:
                        catalogPath = args[++index];
                        break;
                    default:
                        throw new ArgumentException(
                            $"Unknown database migrator argument: {args[index]}");
                }
            }

            return new(reset, migrateOnly, catalogPath);
        }
    }
}
