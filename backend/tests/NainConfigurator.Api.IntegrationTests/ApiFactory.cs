using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace NainConfigurator.Api.IntegrationTests;

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public const string ConnectionString =
        "Server=.\\NAINCONFIGURATOR;" +
        "Database=NainConfigurator_Integration;" +
        "Integrated Security=True;" +
        "Encrypt=True;" +
        "TrustServerCertificate=True;" +
        "Application Name=NainConfigurator.Api.IntegrationTests;" +
        "Connect Timeout=15;";

    protected override void ConfigureWebHost(
        IWebHostBuilder builder)
    {
        builder.UseEnvironment("Integration");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:NainConfigurator"] =
                        ConnectionString,
                    ["TechnicalDemo:SyntheticContactOnly"] = "true",
                    ["Logging:LogLevel:Default"] = "Warning",
                });
        });
    }
}
