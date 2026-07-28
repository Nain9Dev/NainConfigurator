using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using NainConfigurator.Hosting;
using Xunit;

namespace NainConfigurator.Baseline.Tests;

public sealed class HostingExtensionsTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public async Task StartAsyncExposesSyntheticReleaseIdentity()
    {
        HostApplicationBuilder builder = Host.CreateApplicationBuilder();
        builder.Configuration["Runtime:ReleaseId"] = "test-release";
        builder.AddNainConfiguratorDefaults("TestHost");

        using IHost host = builder.Build();

        await host.StartAsync(TestContext.Current.CancellationToken);

        RuntimeOptions runtime = host.Services
            .GetRequiredService<IOptions<RuntimeOptions>>()
            .Value;

        Assert.Equal("test-release", runtime.ReleaseId);
        Assert.Equal("TestHost", runtime.ServiceName);
        Assert.NotEmpty(runtime.EnvironmentName);

        await host.StopAsync(TestContext.Current.CancellationToken);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task StartAsyncFailsWithoutReleaseIdentity()
    {
        HostApplicationBuilder builder = Host.CreateApplicationBuilder();
        builder.Configuration["Runtime:ReleaseId"] = string.Empty;
        builder.AddNainConfiguratorDefaults("TestHost");

        using IHost host = builder.Build();

        OptionsValidationException exception =
            await Assert.ThrowsAsync<OptionsValidationException>(
                () => host.StartAsync(TestContext.Current.CancellationToken));

        Assert.Contains("Runtime:ReleaseId is required.", exception.Failures);
    }
}
