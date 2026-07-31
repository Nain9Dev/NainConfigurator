using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using NainConfigurator.Infrastructure.Persistence;
using Xunit;
#pragma warning disable CA1861 // Inline arrays are isolated test inputs.

namespace NainConfigurator.Api.IntegrationTests;

public sealed class PublicApiTests(ApiFactory factory)
    : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task CatalogsExposeTwoDifferentProductsWithoutInternalIds()
    {
        using HttpClient client = factory.CreateClient();

        using JsonDocument desk = await GetJsonAsync(
            client,
            "/api/v1/companies/naindev-demo/products/DESK-001");
        using JsonDocument bicycle = await GetJsonAsync(
            client,
            "/api/v1/companies/nain-cycle-demo/products/BIKE-001");

        Assert.Equal(
            "DESK-001",
            desk.RootElement.GetProperty("data")
                .GetProperty("product")
                .GetProperty("code")
                .GetString());
        Assert.Equal(
            "BIKE-001",
            bicycle.RootElement.GetProperty("data")
                .GetProperty("product")
                .GetProperty("code")
                .GetString());
        Assert.DoesNotContain(
            "productId",
            desk.RootElement.GetRawText(),
            StringComparison.Ordinal);
        Assert.DoesNotContain(
            "companyId",
            bicycle.RootElement.GetRawText(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task ValidationRecalculatesPriceAndRejectsCompatibilityFailure()
    {
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage valid = await client.PostAsJsonAsync(
            "/api/v1/configurations/validate",
            new
            {
                companySlug = "naindev-demo",
                productCode = "DESK-001",
                catalogVersion = 1,
                selectedOptionCodes = new[]
                {
                    "SIZE_160_80",
                    "FINISH_OAK",
                    "LEG_ELECTRIC_STANDING",
                },
            },
            TestCancellationToken);
        HttpResponseMessage invalid = await client.PostAsJsonAsync(
            "/api/v1/configurations/validate",
            new
            {
                companySlug = "naindev-demo",
                productCode = "DESK-001",
                catalogVersion = 1,
                selectedOptionCodes = new[]
                {
                    "SIZE_120_60",
                    "FINISH_OAK",
                    "LEG_ELECTRIC_STANDING",
                },
            },
            TestCancellationToken);

        Assert.Equal(HttpStatusCode.OK, valid.StatusCode);
        using JsonDocument validJson = await ReadJsonAsync(valid);
        Assert.Equal(
            679.90m,
            validJson.RootElement.GetProperty("data")
                .GetProperty("estimatedPrice")
                .GetDecimal());
        Assert.Equal(
            HttpStatusCode.UnprocessableEntity,
            invalid.StatusCode);
        using JsonDocument invalidJson = await ReadJsonAsync(invalid);
        Assert.Equal(
            "INVALID_OPTION_COMBINATION",
            invalidJson.RootElement.GetProperty("errors")[0]
                .GetProperty("code")
                .GetString());
    }

    [Fact]
    public async Task ConfigurationConcurrentReplayCreatesOneImmutableResource()
    {
        using HttpClient client = factory.CreateClient();
        Guid requestId = Guid.NewGuid();
        var request = new
        {
            clientRequestId = requestId,
            companySlug = "nain-cycle-demo",
            productCode = "BIKE-001",
            catalogVersion = 1,
            selectedOptionCodes = new[]
            {
                "FRAME_M",
                "STYLE_CITY",
                "DRIVE_CHAIN",
                "BRAKE_DISC",
            },
            visualState = (object?)null,
        };

        Task<HttpResponseMessage>[] calls = Enumerable.Range(0, 20)
            .Select(_ => client.PostAsJsonAsync(
                "/api/v1/configurations",
                request,
                TestCancellationToken))
            .ToArray();
        HttpResponseMessage[] responses = await Task.WhenAll(calls);
        var codes = new List<string>();

        foreach (HttpResponseMessage response in responses)
        {
            Assert.Contains(
                response.StatusCode,
                new[]
                {
                    HttpStatusCode.Created,
                    HttpStatusCode.OK,
                });
            using JsonDocument json = await ReadJsonAsync(response);
            codes.Add(
                json.RootElement.GetProperty("data")
                    .GetProperty("configurationCode")
                    .GetString()!);
        }

        string configurationCode = Assert.Single(codes.Distinct());
        Assert.Single(
            responses,
            response => response.StatusCode == HttpStatusCode.Created);

        HttpResponseMessage saved = await client.GetAsync(
            $"/api/v1/configurations/{configurationCode}",
            TestCancellationToken);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using JsonDocument savedJson = await ReadJsonAsync(saved);
        Assert.Equal(
            839m,
            savedJson.RootElement.GetProperty("data")
                .GetProperty("estimatedPrice")
                .GetDecimal());
    }

    [Fact]
    public async Task QuoteReplayCreatesOneQuoteAndOneOutboxIntent()
    {
        using HttpClient client = factory.CreateClient();
        string configurationCode =
            await CreateDeskConfigurationAsync(client);
        Guid requestId = Guid.NewGuid();
        var quote = new
        {
            clientRequestId = requestId,
            configurationCode,
            contact = new
            {
                name = "Synthetic User",
                email = "synthetic.user@example.invalid",
                phone = (string?)null,
            },
            message = "Synthetic integration request",
            privacyPolicy = new
            {
                acknowledged = true,
                version = "2026-07-30",
            },
        };

        Task<HttpResponseMessage>[] calls = Enumerable.Range(0, 20)
            .Select(_ => client.PostAsJsonAsync(
                "/api/v1/quote-requests",
                quote,
                TestCancellationToken))
            .ToArray();
        HttpResponseMessage[] responses = await Task.WhenAll(calls);
        var quoteCodes = new List<string>();

        foreach (HttpResponseMessage response in responses)
        {
            Assert.Contains(
                response.StatusCode,
                new[]
                {
                    HttpStatusCode.Created,
                    HttpStatusCode.OK,
                });
            using JsonDocument json = await ReadJsonAsync(response);
            quoteCodes.Add(
                json.RootElement.GetProperty("data")
                    .GetProperty("quoteRequestCode")
                    .GetString()!);
        }

        string quoteCode = Assert.Single(quoteCodes.Distinct());
        Assert.Single(
            responses,
            response => response.StatusCode == HttpStatusCode.Created);
        Assert.Equal(
            1,
            await CountOutboxIntentsAsync(quoteCode));
    }

    [Fact]
    public async Task ConfigurationFailureBeforeCommitRollsBackAggregate()
    {
        using var faultFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IPersistenceFaultInjector>();
                services.AddSingleton<IPersistenceFaultInjector,
                    ThrowingPersistenceFaultInjector>();
            });
        });
        using HttpClient client = faultFactory.CreateClient();
        Guid requestId = Guid.NewGuid();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/v1/configurations",
            new
            {
                clientRequestId = requestId,
                companySlug = "naindev-demo",
                productCode = "DESK-001",
                catalogVersion = 1,
                selectedOptionCodes = new[]
                {
                    "SIZE_120_60",
                    "FINISH_OAK",
                    "LEG_FIXED",
                },
                visualState = (object?)null,
            },
            TestCancellationToken);

        Assert.Equal(
            HttpStatusCode.InternalServerError,
            response.StatusCode);
        Assert.Equal(
            0,
            await CountConfigurationsAsync(requestId));
    }

    [Fact]
    public async Task PublicResponsesExposeRequiredSecurityAndLocaleHeaders()
    {
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage catalog = await client.GetAsync(
            "/api/v1/companies/naindev-demo/products/DESK-001",
            TestCancellationToken);

        Assert.Equal(HttpStatusCode.OK, catalog.StatusCode);
        Assert.Contains(
            "default-src 'self'",
            Assert.Single(catalog.Headers.GetValues(
                "Content-Security-Policy")),
            StringComparison.Ordinal);
        Assert.Equal(
            "nosniff",
            Assert.Single(catalog.Headers.GetValues(
                "X-Content-Type-Options")));
        Assert.Equal(
            "DENY",
            Assert.Single(catalog.Headers.GetValues("X-Frame-Options")));
        Assert.Equal(
            "strict-origin-when-cross-origin",
            Assert.Single(catalog.Headers.GetValues("Referrer-Policy")));
        Assert.Single(catalog.Headers.GetValues("Permissions-Policy"));
        Assert.Equal(
            "es-ES",
            Assert.Single(catalog.Content.Headers.ContentLanguage));
    }

    [Fact]
    public async Task RateLimitReturnsStableErrorAndRetryAfter()
    {
        using var isolatedFactory = factory.WithWebHostBuilder(_ => { });
        using HttpClient client = isolatedFactory.CreateClient();
        HttpResponseMessage? rejected = null;

        for (int index = 0; index < 121; index++)
        {
            HttpResponseMessage response = await client.GetAsync(
                "/health/live",
                TestCancellationToken);

            if (response.StatusCode ==
                HttpStatusCode.TooManyRequests)
            {
                rejected = response;
                break;
            }
        }

        Assert.NotNull(rejected);
        Assert.Equal(
            "60",
            Assert.Single(rejected.Headers.GetValues("Retry-After")));
        using JsonDocument body = await ReadJsonAsync(rejected);
        Assert.Equal(
            "RATE_LIMIT_EXCEEDED",
            body.RootElement.GetProperty("errors")[0]
                .GetProperty("code")
                .GetString());
    }

    [Fact]
    public async Task PublicBoundaryRejectsUnknownPropertiesAndRealEmail()
    {
        using HttpClient client = factory.CreateClient();
        var unknownPropertyRequest = new StringContent(
            """
            {
              "companySlug": "naindev-demo",
              "productCode": "DESK-001",
              "catalogVersion": 1,
              "selectedOptionCodes": ["SIZE_120_60"],
              "deskWidth": 120
            }
            """,
            Encoding.UTF8,
            "application/json");

        HttpResponseMessage unknown = await client.PostAsync(
            "/api/v1/configurations/validate",
            unknownPropertyRequest,
            TestCancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, unknown.StatusCode);

        string configurationCode =
            await CreateDeskConfigurationAsync(client);
        HttpResponseMessage realEmail = await client.PostAsJsonAsync(
            "/api/v1/quote-requests",
            new
            {
                clientRequestId = Guid.NewGuid(),
                configurationCode,
                contact = new
                {
                    name = "Real Data Rejected",
                    email = "person@example.com",
                    phone = (string?)null,
                },
                message = (string?)null,
                privacyPolicy = new
                {
                    acknowledged = true,
                    version = "2026-07-30",
                },
            },
            TestCancellationToken);

        Assert.Equal(
            HttpStatusCode.UnprocessableEntity,
            realEmail.StatusCode);
        using JsonDocument realEmailJson = await ReadJsonAsync(realEmail);
        Assert.Equal(
            "SYNTHETIC_CONTACT_REQUIRED",
            realEmailJson.RootElement.GetProperty("errors")[0]
                .GetProperty("code")
                .GetString());
    }

    private static async Task<string> CreateDeskConfigurationAsync(
        HttpClient client)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/v1/configurations",
            new
            {
                clientRequestId = Guid.NewGuid(),
                companySlug = "naindev-demo",
                productCode = "DESK-001",
                catalogVersion = 1,
                selectedOptionCodes = new[]
                {
                    "SIZE_120_60",
                    "FINISH_OAK",
                    "LEG_FIXED",
                },
                visualState = (object?)null,
            },
            TestCancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using JsonDocument json = await ReadJsonAsync(response);
        return json.RootElement.GetProperty("data")
            .GetProperty("configurationCode")
            .GetString()!;
    }

    private static async Task<int> CountOutboxIntentsAsync(string quoteCode)
    {
        await using var connection =
            new SqlConnection(ApiFactory.ConnectionString);
        await connection.OpenAsync(TestCancellationToken);

        try
        {
            await using (SqlCommand impersonate = connection.CreateCommand())
            {
                impersonate.CommandText =
                    "EXECUTE AS USER = N'NainConfiguratorDemoSeeder';";
                await impersonate.ExecuteNonQueryAsync(TestCancellationToken);
            }

            await using SqlCommand count = connection.CreateCommand();
            count.CommandText =
                """
                SELECT COUNT_BIG(*)
                FROM [operations].[QuoteNotificationOutbox] AS [Outbox]
                INNER JOIN [sales].[QuoteRequests] AS [Quote]
                    ON [Outbox].[CompanyId] = [Quote].[CompanyId]
                    AND [Outbox].[QuoteRequestId] = [Quote].[QuoteRequestId]
                WHERE [Quote].[QuoteRequestCode] = @QuoteCode;
                """;
            count.Parameters.AddWithValue("@QuoteCode", quoteCode);
            return checked(
                (int)(long)(await count.ExecuteScalarAsync(
                    TestCancellationToken))!);
        }
        finally
        {
            await using SqlCommand revert = connection.CreateCommand();
            revert.CommandText = "REVERT;";
            await revert.ExecuteNonQueryAsync(TestCancellationToken);
        }
    }

    private static async Task<int> CountConfigurationsAsync(
        Guid clientRequestId)
    {
        await using var connection =
            new SqlConnection(ApiFactory.ConnectionString);
        await connection.OpenAsync(TestCancellationToken);

        try
        {
            await using (SqlCommand impersonate = connection.CreateCommand())
            {
                impersonate.CommandText =
                    "EXECUTE AS USER = N'NainConfiguratorDemoSeeder';";
                await impersonate.ExecuteNonQueryAsync(TestCancellationToken);
            }

            await using SqlCommand count = connection.CreateCommand();
            count.CommandText =
                """
                SELECT COUNT_BIG(*)
                FROM [sales].[Configurations]
                WHERE [ClientRequestId] = @ClientRequestId;
                """;
            count.Parameters.AddWithValue(
                "@ClientRequestId",
                clientRequestId);
            return checked(
                (int)(long)(await count.ExecuteScalarAsync(
                    TestCancellationToken))!);
        }
        finally
        {
            await using SqlCommand revert = connection.CreateCommand();
            revert.CommandText = "REVERT;";
            await revert.ExecuteNonQueryAsync(TestCancellationToken);
        }
    }

    private static async Task<JsonDocument> GetJsonAsync(
        HttpClient client,
        string path)
    {
        HttpResponseMessage response = await client.GetAsync(
            path,
            TestCancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await ReadJsonAsync(response);
    }

    private static async Task<JsonDocument> ReadJsonAsync(
        HttpResponseMessage response)
    {
        await using Stream stream =
            await response.Content.ReadAsStreamAsync(
                TestCancellationToken);
        return await JsonDocument.ParseAsync(
            stream,
            cancellationToken: TestCancellationToken);
    }

    private static CancellationToken TestCancellationToken =>
        TestContext.Current.CancellationToken;

    private sealed class ThrowingPersistenceFaultInjector
        : IPersistenceFaultInjector
    {
        public Task OnConfigurationPersistedBeforeCommitAsync(
            CancellationToken cancellationToken) =>
            Task.FromException(
                new InvalidOperationException(
                    "Synthetic persistence failure."));
    }
}
#pragma warning restore CA1861
