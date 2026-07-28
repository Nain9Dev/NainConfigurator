using Microsoft.Extensions.Options;
using NainConfigurator.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.AddNainConfiguratorDefaults("PublicHost");
builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");

var runtime = app.Services.GetRequiredService<IOptions<RuntimeOptions>>().Value;

BaselineLogMessages.HostStarted(
    app.Logger,
    runtime.ServiceName,
    runtime.EnvironmentName,
    runtime.ReleaseId);

app.Run();
