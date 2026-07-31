using Microsoft.Extensions.Options;
using NainConfigurator.Application;
using NainConfigurator.Domain;

namespace NainConfigurator.PublicHost;

internal static class PublicApiEndpoints
{
    public static IEndpointRouteBuilder MapNainConfiguratorPublicApi(
        this IEndpointRouteBuilder endpoints)
    {
        RouteGroupBuilder api = endpoints.MapGroup("/api/v1");

        api.MapGet(
            "/companies/{companySlug}/products/{productCode}",
            GetProductAsync);
        api.MapPost(
            "/configurations/validate",
            ValidateConfigurationAsync);
        api.MapPost(
            "/configurations",
            CreateConfigurationAsync);
        api.MapGet(
            "/configurations/{configurationCode}",
            GetConfigurationAsync);
        api.MapPost(
            "/quote-requests",
            CreateQuoteRequestAsync);

        return endpoints;
    }

    private static async Task<IResult> GetProductAsync(
        string companySlug,
        string productCode,
        HttpContext context,
        PublicConfigurator configurator)
    {
        ProductDefinition? product =
            await configurator.GetPublishedProductAsync(
                companySlug,
                productCode,
                context.RequestAborted);

        if (product is null)
        {
            return ApiResult(
                context,
                ApiEnvelope.Failure<object>(
                    context,
                    new UseCaseError(
                        "PRODUCT_NOT_FOUND",
                        "El producto solicitado no existe.",
                        "productCode")),
                StatusCodes.Status404NotFound);
        }

        context.Response.Headers.ContentLanguage =
            product.Company.Locale;

        return ApiResult(
            context,
            ApiEnvelope.Success(
                context,
                ApiContractMapper.Map(product)),
            StatusCodes.Status200OK);
    }

    private static async Task<IResult> ValidateConfigurationAsync(
        HttpContext context,
        PublicConfigurator configurator)
    {
        BodyReadResult<ValidateConfigurationCommand> body =
            await PublicBodyReader.ReadAsync<ValidateConfigurationCommand>(
                context);

        if (!body.IsSuccess)
        {
            return ApiResult(
                context,
                body.Error!,
                StatusCodes.Status400BadRequest);
        }

        UseCaseResult<ValidateConfigurationData> result =
            await configurator.ValidateAsync(
                body.Value!,
                context.RequestAborted);
        SetContentLanguage(context, result.Data?.ContentLocale);
        return MapUseCaseResult(context, result);
    }

    private static async Task<IResult> CreateConfigurationAsync(
        HttpContext context,
        PublicConfigurator configurator)
    {
        BodyReadResult<CreateConfigurationCommand> body =
            await PublicBodyReader.ReadAsync<CreateConfigurationCommand>(
                context);

        if (!body.IsSuccess)
        {
            return ApiResult(
                context,
                body.Error!,
                StatusCodes.Status400BadRequest);
        }

        UseCaseResult<CreateConfigurationData> result =
            await configurator.CreateConfigurationAsync(
                body.Value!,
                context.RequestAborted);
        SetContentLanguage(context, result.Data?.ContentLocale);
        return MapUseCaseResult(context, result);
    }

    private static async Task<IResult> GetConfigurationAsync(
        string configurationCode,
        HttpContext context,
        PublicConfigurator configurator)
    {
        SavedConfigurationData? configuration =
            await configurator.GetConfigurationAsync(
                configurationCode,
                context.RequestAborted);

        if (configuration is null)
        {
            return ApiResult(
                context,
                ApiEnvelope.Failure<object>(
                    context,
                    new UseCaseError(
                        "CONFIGURATION_NOT_FOUND",
                        "La configuración seleccionada no existe.",
                        "configurationCode")),
                StatusCodes.Status404NotFound);
        }

        SetContentLanguage(context, configuration.ContentLocale);
        return ApiResult(
            context,
            ApiEnvelope.Success(context, configuration),
            StatusCodes.Status200OK);
    }

    private static async Task<IResult> CreateQuoteRequestAsync(
        HttpContext context,
        PublicConfigurator configurator,
        IOptions<TechnicalDemoOptions> demoOptions)
    {
        BodyReadResult<CreateQuoteRequestCommand> body =
            await PublicBodyReader.ReadAsync<CreateQuoteRequestCommand>(
                context);

        if (!body.IsSuccess)
        {
            return ApiResult(
                context,
                body.Error!,
                StatusCodes.Status400BadRequest);
        }

        if (demoOptions.Value.SyntheticContactOnly &&
            body.Value!.Contact is { Email: string email } &&
            !email.EndsWith(
                ".invalid",
                StringComparison.OrdinalIgnoreCase))
        {
            return ApiResult(
                context,
                ApiEnvelope.Failure<object>(
                    context,
                    new UseCaseError(
                        "SYNTHETIC_CONTACT_REQUIRED",
                        "La demo técnica solo acepta correos ficticios terminados en .invalid.",
                        "contact.email")),
                StatusCodes.Status422UnprocessableEntity);
        }

        UseCaseResult<CreateQuoteRequestData> result =
            await configurator.CreateQuoteRequestAsync(
                body.Value!,
                context.RequestAborted);
        return MapUseCaseResult(context, result);
    }

    private static IResult MapUseCaseResult<T>(
        HttpContext context,
        UseCaseResult<T> result)
    {
        int statusCode = result.Status switch
        {
            UseCaseStatus.Ok or UseCaseStatus.Existing =>
                StatusCodes.Status200OK,
            UseCaseStatus.Created => StatusCodes.Status201Created,
            UseCaseStatus.InvalidRequest =>
                StatusCodes.Status400BadRequest,
            UseCaseStatus.NotFound => StatusCodes.Status404NotFound,
            UseCaseStatus.Conflict => StatusCodes.Status409Conflict,
            UseCaseStatus.Unprocessable =>
                StatusCodes.Status422UnprocessableEntity,
            _ => StatusCodes.Status500InternalServerError,
        };

        object response = result.IsSuccess
            ? ApiEnvelope.Success(context, result.Data!)
            : new ApiResponse<object>(
                false,
                result.ConflictData,
                result.Errors,
                context.TraceIdentifier);

        return ApiResult(context, response, statusCode);
    }

    private static IResult ApiResult(
        HttpContext context,
        object response,
        int statusCode)
    {
        context.Response.Headers.CacheControl = "no-store";
        return Results.Json(
            response,
            ApiJson.Options,
            "application/json; charset=utf-8",
            statusCode);
    }

    private static void SetContentLanguage(
        HttpContext context,
        string? locale)
    {
        if (!string.IsNullOrWhiteSpace(locale))
        {
            context.Response.Headers.ContentLanguage = locale;
        }
    }
}
