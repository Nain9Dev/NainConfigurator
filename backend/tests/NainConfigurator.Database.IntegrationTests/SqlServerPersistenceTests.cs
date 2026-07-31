using System.Data;
using Microsoft.Data.SqlClient;
using Xunit;

namespace NainConfigurator.Database.IntegrationTests;

public sealed class SqlServerPersistenceTests
{
    private const string ConnectionString =
        "Server=.\\NAINCONFIGURATOR;" +
        "Database=NainConfigurator_Integration;" +
        "Integrated Security=True;" +
        "Encrypt=True;" +
        "TrustServerCertificate=True;" +
        "Application Name=NainConfigurator.Database.IntegrationTests;" +
        "Connect Timeout=15;";

    [Fact]
    public async Task DatabaseUsesApprovedCompatibilityAndIsolationPolicy()
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(TestCancellationToken);

        await using SqlCommand command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT
                [compatibility_level],
                [is_read_committed_snapshot_on],
                [snapshot_isolation_state]
            FROM [sys].[databases]
            WHERE [name] = DB_NAME();

            SELECT COUNT_BIG(*)
            FROM [sys].[security_policies]
            WHERE [name] = N'CompanyIsolationPolicy'
                AND [is_enabled] = 1;

            SELECT COUNT_BIG(*)
            FROM [sys].[tables]
            WHERE SCHEMA_NAME([schema_id])
                IN (N'catalog', N'sales', N'operations');
            """;

        await using SqlDataReader reader =
            await command.ExecuteReaderAsync(TestCancellationToken);
        Assert.True(await reader.ReadAsync(TestCancellationToken));
        Assert.Equal(170, reader.GetByte(0));
        Assert.True(reader.GetBoolean(1));
        Assert.Equal(1, reader.GetByte(2));
        Assert.True(
            await reader.NextResultAsync(TestCancellationToken));
        Assert.True(await reader.ReadAsync(TestCancellationToken));
        Assert.Equal(1L, reader.GetInt64(0));
        Assert.True(
            await reader.NextResultAsync(TestCancellationToken));
        Assert.True(await reader.ReadAsync(TestCancellationToken));
        Assert.Equal(14L, reader.GetInt64(0));
    }

    [Fact]
    public async Task RlsReusedConnectionNeverLeaksAnotherCompany()
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(TestCancellationToken);
        long furnitureCompanyId = await ResolveCompanyAsync(
            connection,
            "naindev-demo");
        long bicycleCompanyId = await ResolveCompanyAsync(
            connection,
            "nain-cycle-demo");

        await SetCompanyContextAsync(connection, furnitureCompanyId);
        Assert.Equal(
            ["naindev-demo"],
            await ReadVisibleCompanySlugsAsync(connection));

        await SetCompanyContextAsync(connection, bicycleCompanyId);
        Assert.Equal(
            ["nain-cycle-demo"],
            await ReadVisibleCompanySlugsAsync(connection));

        await SetCompanyContextAsync(connection, null);
        Assert.Empty(await ReadVisibleCompanySlugsAsync(connection));

        await SetRawCompanyContextAsync(connection, "not-a-company-id");
        Assert.Empty(await ReadVisibleCompanySlugsAsync(connection));
    }

    [Fact]
    public async Task RlsBlockPredicateRejectsCrossCompanyInsert()
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(TestCancellationToken);
        long furnitureCompanyId = await ResolveCompanyAsync(
            connection,
            "naindev-demo");
        long bicycleCompanyId = await ResolveCompanyAsync(
            connection,
            "nain-cycle-demo");
        await SetCompanyContextAsync(connection, furnitureCompanyId);
        await using SqlTransaction transaction =
            (SqlTransaction)await connection.BeginTransactionAsync(
                TestCancellationToken);

        try
        {
            await using SqlCommand command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText =
                """
                INSERT INTO [catalog].[Products]
                (
                    [CompanyId],
                    [Code],
                    [Name],
                    [Description],
                    [CatalogVersion],
                    [BasePrice],
                    [CurrencyCode],
                    [PriceDisclaimer],
                    [VisualAssetKey],
                    [IsActive],
                    [IsPublished]
                )
                VALUES
                (
                    @CompanyId,
                    'CROSS_TENANT_TEST',
                    N'Cross tenant test',
                    N'Synthetic negative test',
                    1,
                    0,
                    'EUR',
                    N'Synthetic',
                    NULL,
                    0,
                    0
                );
                """;
            command.Parameters.AddWithValue(
                "@CompanyId",
                bicycleCompanyId);

            SqlException exception = await Assert.ThrowsAsync<SqlException>(
                () => command.ExecuteNonQueryAsync(
                    TestCancellationToken));
            Assert.Equal(33504, exception.Number);
        }
        finally
        {
            await transaction.RollbackAsync(TestCancellationToken);
        }
    }

    [Fact]
    public async Task CompositeForeignKeyRejectsCrossCompanyRelationship()
    {
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync(TestCancellationToken);
        await ExecuteNonQueryAsync(
            connection,
            "EXECUTE AS USER = 'NainConfiguratorDemoSeeder';");
        await using SqlTransaction transaction =
            (SqlTransaction)await connection.BeginTransactionAsync(
                TestCancellationToken);

        try
        {
            (long furnitureCompanyId, long bicycleProductId) =
                await ReadCrossCompanyKeysAsync(connection, transaction);
            await using SqlCommand command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText =
                """
                INSERT INTO [catalog].[OptionGroups]
                (
                    [CompanyId],
                    [ProductId],
                    [Code],
                    [Name],
                    [MinSelections],
                    [MaxSelections],
                    [IsActive],
                    [SortOrder]
                )
                VALUES
                (
                    @CompanyId,
                    @ProductId,
                    'CROSS_TENANT_GROUP',
                    N'Cross tenant group',
                    0,
                    1,
                    0,
                    999
                );
                """;
            command.Parameters.AddWithValue(
                "@CompanyId",
                furnitureCompanyId);
            command.Parameters.AddWithValue(
                "@ProductId",
                bicycleProductId);

            SqlException exception = await Assert.ThrowsAsync<SqlException>(
                () => command.ExecuteNonQueryAsync(
                    TestCancellationToken));
            Assert.Equal(547, exception.Number);
        }
        finally
        {
            await transaction.RollbackAsync(TestCancellationToken);
            await ExecuteNonQueryAsync(connection, "REVERT;");
        }
    }

    private static async Task<long> ResolveCompanyAsync(
        SqlConnection connection,
        string companySlug)
    {
        await using SqlCommand command = connection.CreateCommand();
        command.CommandText = "[security].[ResolveCompanyScopeBySlug]";
        command.CommandType = CommandType.StoredProcedure;
        command.Parameters.Add(
            new SqlParameter("@Slug", SqlDbType.VarChar, 100)
            {
                Value = companySlug,
            });
        object result = await command.ExecuteScalarAsync(
            TestCancellationToken)
            ?? throw new InvalidOperationException(
                "The synthetic company could not be resolved.");
        return (long)result;
    }

    private static async Task SetCompanyContextAsync(
        SqlConnection connection,
        long? companyId)
    {
        await using SqlCommand command = connection.CreateCommand();
        command.CommandText =
            "EXEC sys.sp_set_session_context " +
            "@key=N'CompanyId', @value=@CompanyId, @read_only=0;";
        command.Parameters.Add(
            new SqlParameter("@CompanyId", SqlDbType.BigInt)
            {
                Value = companyId is null ? DBNull.Value : companyId.Value,
            });
        await command.ExecuteNonQueryAsync(TestCancellationToken);
    }

    private static async Task SetRawCompanyContextAsync(
        SqlConnection connection,
        string rawValue)
    {
        await using SqlCommand command = connection.CreateCommand();
        command.CommandText =
            "EXEC sys.sp_set_session_context " +
            "@key=N'CompanyId', @value=@CompanyId, @read_only=0;";
        command.Parameters.AddWithValue("@CompanyId", rawValue);
        await command.ExecuteNonQueryAsync(TestCancellationToken);
    }

    private static async Task<string[]> ReadVisibleCompanySlugsAsync(
        SqlConnection connection)
    {
        await using SqlCommand command = connection.CreateCommand();
        command.CommandText =
            "SELECT [Slug] FROM [catalog].[Companies] ORDER BY [Slug];";
        await using SqlDataReader reader =
            await command.ExecuteReaderAsync(TestCancellationToken);
        var slugs = new List<string>();

        while (await reader.ReadAsync(TestCancellationToken))
        {
            slugs.Add(reader.GetString(0));
        }

        return slugs.ToArray();
    }

    private static async Task<(long CompanyId, long ProductId)>
        ReadCrossCompanyKeysAsync(
            SqlConnection connection,
            SqlTransaction transaction)
    {
        await using SqlCommand command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText =
            """
            SELECT
                (
                    SELECT [CompanyId]
                    FROM [catalog].[Companies]
                    WHERE [Slug] = 'naindev-demo'
                ),
                (
                    SELECT [ProductId]
                    FROM [catalog].[Products]
                    WHERE [Code] = 'BIKE-001'
                );
            """;
        await using SqlDataReader reader =
            await command.ExecuteReaderAsync(TestCancellationToken);
        Assert.True(await reader.ReadAsync(TestCancellationToken));
        return (reader.GetInt64(0), reader.GetInt64(1));
    }

    private static async Task ExecuteNonQueryAsync(
        SqlConnection connection,
        string commandText)
    {
        await using SqlCommand command = connection.CreateCommand();
        command.CommandText = commandText;
        await command.ExecuteNonQueryAsync(TestCancellationToken);
    }

    private static CancellationToken TestCancellationToken =>
        TestContext.Current.CancellationToken;
}
