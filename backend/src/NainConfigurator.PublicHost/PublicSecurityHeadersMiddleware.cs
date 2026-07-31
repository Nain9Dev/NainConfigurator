namespace NainConfigurator.PublicHost;

public sealed class PublicSecurityHeadersMiddleware(
    RequestDelegate next,
    IHostEnvironment environment)
{
    private const string ContentSecurityPolicy =
        "default-src 'self'; " +
        "base-uri 'none'; " +
        "object-src 'none'; " +
        "frame-ancestors 'none'; " +
        "form-action 'self'; " +
        "script-src 'self'; " +
        "style-src 'self'; " +
        "img-src 'self' data:; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "worker-src 'none'; " +
        "frame-src 'none'; " +
        "manifest-src 'self'";

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            IHeaderDictionary headers = context.Response.Headers;
            headers.ContentSecurityPolicy = ContentSecurityPolicy;
            headers.XContentTypeOptions = "nosniff";
            headers.Append(
                "Referrer-Policy",
                "strict-origin-when-cross-origin");
            headers.Append("Permissions-Policy",
                "camera=(), microphone=(), geolocation=(), payment=(), " +
                "usb=(), accelerometer=(), gyroscope=(), magnetometer=()");
            headers.Append("X-Frame-Options", "DENY");

            if (environment.IsProduction() && context.Request.IsHttps)
            {
                headers.StrictTransportSecurity =
                    "max-age=31536000; includeSubDomains";
            }

            return Task.CompletedTask;
        });

        await next(context);
    }
}
