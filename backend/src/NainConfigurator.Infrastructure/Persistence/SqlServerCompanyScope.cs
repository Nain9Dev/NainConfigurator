using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace NainConfigurator.Infrastructure.Persistence;

internal sealed class SqlServerCompanyScope : IAsyncDisposable
{
    private readonly SqlConnection connection;
    private bool disposed;

    private SqlServerCompanyScope(
        NainConfiguratorDbContext context,
        SqlConnection connection,
        long companyId,
        long? configurationId)
    {
        Context = context;
        this.connection = connection;
        CompanyId = companyId;
        ConfigurationId = configurationId;
    }

    public NainConfiguratorDbContext Context { get; }

    public long CompanyId { get; }

    public long? ConfigurationId { get; }

    public static Task<SqlServerCompanyScope?> OpenByCompanySlugAsync(
        IDbContextFactory<NainConfiguratorDbContext> contextFactory,
        string companySlug,
        CancellationToken cancellationToken) =>
        OpenAsync(
            contextFactory,
            "[security].[ResolveCompanyScopeBySlug]",
            new SqlParameter("@Slug", SqlDbType.VarChar, 100)
            {
                Value = companySlug,
            },
            hasConfigurationId: false,
            cancellationToken);

    public static Task<SqlServerCompanyScope?> OpenByConfigurationCodeAsync(
        IDbContextFactory<NainConfiguratorDbContext> contextFactory,
        string configurationCode,
        CancellationToken cancellationToken) =>
        OpenAsync(
            contextFactory,
            "[security].[ResolveConfigurationScopeByCode]",
            new SqlParameter("@ConfigurationCode", SqlDbType.Char, 28)
            {
                Value = configurationCode,
            },
            hasConfigurationId: true,
            cancellationToken);

    public async ValueTask DisposeAsync()
    {
        if (disposed)
        {
            return;
        }

        disposed = true;
        bool contextCleared = false;

        try
        {
            await SetCompanyContextAsync(
                connection,
                companyId: null,
                CancellationToken.None);
            contextCleared = true;
        }
        finally
        {
            if (!contextCleared)
            {
                SqlConnection.ClearPool(connection);
            }

            await Context.DisposeAsync();
        }
    }

    private static async Task<SqlServerCompanyScope?> OpenAsync(
        IDbContextFactory<NainConfiguratorDbContext> contextFactory,
        string resolverName,
        SqlParameter parameter,
        bool hasConfigurationId,
        CancellationToken cancellationToken)
    {
        NainConfiguratorDbContext context =
            await contextFactory.CreateDbContextAsync(cancellationToken);
        var connection =
            (SqlConnection)context.Database.GetDbConnection();

        try
        {
            await connection.OpenAsync(cancellationToken);

            (long CompanyId, long? ConfigurationId)? resolution =
                await ResolveAsync(
                    connection,
                    resolverName,
                    parameter,
                    hasConfigurationId,
                    cancellationToken);

            if (resolution is null)
            {
                await context.DisposeAsync();
                return null;
            }

            await SetCompanyContextAsync(
                connection,
                resolution.Value.CompanyId,
                cancellationToken);

            return new(
                context,
                connection,
                resolution.Value.CompanyId,
                resolution.Value.ConfigurationId);
        }
        catch
        {
            await context.DisposeAsync();
            throw;
        }
    }

    private static async Task<(long CompanyId, long? ConfigurationId)?> ResolveAsync(
        SqlConnection connection,
        string resolverName,
        SqlParameter parameter,
        bool hasConfigurationId,
        CancellationToken cancellationToken)
    {
        await using SqlCommand command = connection.CreateCommand();
        command.CommandText = resolverName;
        command.CommandType = CommandType.StoredProcedure;
        command.Parameters.Add(parameter);

        await using SqlDataReader reader =
            await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        long companyId = reader.GetInt64(0);
        long? configurationId = hasConfigurationId
            ? reader.GetInt64(1)
            : null;

        return (companyId, configurationId);
    }

    private static async Task SetCompanyContextAsync(
        SqlConnection connection,
        long? companyId,
        CancellationToken cancellationToken)
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

        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
