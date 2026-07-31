using NainConfigurator.Application;
using Microsoft.AspNetCore.Http.Features;

namespace NainConfigurator.PublicHost;

public sealed class PublicRequestBoundaryMiddleware(
    RequestDelegate next)
{
    private const long ConfigurationBodyLimit = 128 * 1024;
    private const long QuoteBodyLimit = 8 * 1024;

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/api/v1") &&
            HttpMethods.IsPost(context.Request.Method))
        {
            if (context.Request.Headers.ContainsKey("Content-Encoding"))
            {
                await RejectAsync(
                    context,
                    StatusCodes.Status415UnsupportedMediaType,
                    new(
                        "UNSUPPORTED_CONTENT_ENCODING",
                        "La API pública no acepta cuerpos comprimidos.",
                        null));
                return;
            }

            if (!context.Request.HasJsonContentType())
            {
                await RejectAsync(
                    context,
                    StatusCodes.Status415UnsupportedMediaType,
                    new(
                        "UNSUPPORTED_MEDIA_TYPE",
                        "La solicitud debe usar application/json.",
                        null));
                return;
            }

            long limit = context.Request.Path.Equals(
                "/api/v1/quote-requests",
                StringComparison.Ordinal)
                ? QuoteBodyLimit
                : ConfigurationBodyLimit;

            if (context.Request.ContentLength > limit)
            {
                await RejectAsync(
                    context,
                    StatusCodes.Status413PayloadTooLarge,
                    new(
                        "REQUEST_TOO_LARGE",
                        "La solicitud supera el tamaño permitido.",
                        null));
                return;
            }

            IHttpMaxRequestBodySizeFeature? feature =
                context.Features.Get<IHttpMaxRequestBodySizeFeature>();

            if (feature is { IsReadOnly: false })
            {
                feature.MaxRequestBodySize = limit;
            }
        }

        await next(context);
    }

    private static async Task RejectAsync(
        HttpContext context,
        int statusCode,
        UseCaseError error)
    {
        context.Response.StatusCode = statusCode;
        context.Response.Headers.CacheControl = "no-store";
        await context.Response.WriteAsJsonAsync(
            ApiEnvelope.Failure<object>(context, error),
            ApiJson.Options,
            context.RequestAborted);
    }
}
