using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using NainConfigurator.Hosting;
using NainConfigurator.Infrastructure;
using NainConfigurator.PublicHost;

var builder = WebApplication.CreateBuilder(args);

builder.AddNainConfiguratorDefaults("PublicHost");
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 128 * 1024;
});

string connectionString =
    builder.Configuration.GetConnectionString("NainConfigurator")
    ?? throw new InvalidOperationException(
        "ConnectionStrings:NainConfigurator is required.");

builder.Services.AddNainConfiguratorInfrastructure(connectionString);
builder.Services
    .AddOptions<TechnicalDemoOptions>()
    .Bind(builder.Configuration.GetSection(TechnicalDemoOptions.SectionName))
    .ValidateOnStart();
builder.Services.AddHealthChecks()
    .AddCheck<SqlServerReadyHealthCheck>("sql-server-ready");
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter =
        PartitionedRateLimiter.Create<HttpContext, string>(context =>
            RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 120,
                    QueueLimit = 0,
                    Window = TimeSpan.FromMinutes(1),
                    AutoReplenishment = true,
                }));
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode =
            StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers.RetryAfter = "60";
        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiEnvelope.Failure<object>(
                context.HttpContext,
                new NainConfigurator.Application.UseCaseError(
                    "RATE_LIMIT_EXCEEDED",
                    "Se ha superado temporalmente el límite de solicitudes.",
                    null)),
            ApiJson.Options,
            cancellationToken);
    };
});

var app = builder.Build();

app.UseExceptionHandler(handler =>
{
    handler.Run(async context =>
    {
        IExceptionHandlerFeature? feature =
            context.Features.Get<IExceptionHandlerFeature>();
        PublicHostLogMessages.UnhandledRequest(
            app.Logger,
            feature?.Error,
            context.TraceIdentifier);
        context.Response.StatusCode =
            StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(
            ApiEnvelope.Failure<object>(
                context,
                new NainConfigurator.Application.UseCaseError(
                    "INTERNAL_ERROR",
                    "No se pudo completar la solicitud.",
                    null)),
            ApiJson.Options,
            context.RequestAborted);
    });
});

app.UseMiddleware<PublicSecurityHeadersMiddleware>();
app.UseRateLimiter();
app.UseMiddleware<PublicRequestBoundaryMiddleware>();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapHealthChecks("/health/live", new()
{
    Predicate = _ => false,
});
app.MapHealthChecks("/health/ready");
app.MapNainConfiguratorPublicApi();
app.MapFallbackToFile("index.html");

var runtime = app.Services.GetRequiredService<IOptions<RuntimeOptions>>().Value;

BaselineLogMessages.HostStarted(
    app.Logger,
    runtime.ServiceName,
    runtime.EnvironmentName,
    runtime.ReleaseId);

app.Run();

public partial class Program;
