using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace NainConfigurator.Database.IntegrationTests;

public sealed class SqlServerConnectivityTests
{
    [Fact]
    [Trait("Category", "SqlServer")]
    public async Task CanConnectAsyncUsesConfiguredSqlServer2025Developer()
    {
        string? connectionString =
            Environment.GetEnvironmentVariable("NAINCONFIGURATOR_SQL_CONNECTION");

        Assert.False(
            string.IsNullOrWhiteSpace(connectionString),
            "NAINCONFIGURATOR_SQL_CONNECTION must target SQL Server 2025 Developer.");

        var options = new DbContextOptionsBuilder<ConnectivityDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        await using var context = new ConnectivityDbContext(options);

        Assert.True(
            await context.Database.CanConnectAsync(
                TestContext.Current.CancellationToken));

        await context.Database.OpenConnectionAsync(
            TestContext.Current.CancellationToken);

        await using DbCommand command =
            context.Database.GetDbConnection().CreateCommand();

        command.CommandText = """
            SELECT
                CAST(SERVERPROPERTY('ProductMajorVersion') AS int),
                CAST(SERVERPROPERTY('Edition') AS nvarchar(128));
            """;

        await using DbDataReader reader = await command.ExecuteReaderAsync(
            TestContext.Current.CancellationToken);

        Assert.True(
            await reader.ReadAsync(TestContext.Current.CancellationToken));
        Assert.Equal(17, reader.GetInt32(0));
        Assert.Contains(
            "Developer",
            reader.GetString(1),
            StringComparison.OrdinalIgnoreCase);
    }

    private sealed class ConnectivityDbContext(
        DbContextOptions<ConnectivityDbContext> options)
        : DbContext(options);
}
