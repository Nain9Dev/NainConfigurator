using System.Text.Json;
using System.Text.Json.Serialization;
using NainConfigurator.Application;
using NainConfigurator.Domain;

namespace NainConfigurator.PublicHost;

internal static class ApiJson
{
    public static JsonSerializerOptions Options { get; } = CreateOptions();

    private static JsonSerializerOptions CreateOptions() =>
        new(JsonSerializerDefaults.Web)
        {
            MaxDepth = 16,
            PropertyNameCaseInsensitive = false,
            UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        };
}

internal sealed record ApiResponse<T>(
    bool Success,
    T? Data,
    IReadOnlyList<UseCaseError> Errors,
    string TraceId);

internal static class ApiEnvelope
{
    public static ApiResponse<T> Success<T>(
        HttpContext context,
        T data) =>
        new(
            true,
            data,
            Array.Empty<UseCaseError>(),
            context.TraceIdentifier);

    public static ApiResponse<T> Failure<T>(
        HttpContext context,
        params UseCaseError[] errors) =>
        new(
            false,
            default,
            errors,
            context.TraceIdentifier);
}

internal sealed record ProductCatalogResponse(
    CatalogCompanyResponse Company,
    CatalogProductResponse Product);

internal sealed record CatalogCompanyResponse(
    string Slug,
    string Name,
    string Locale,
    BrandProfileDefinition? Branding,
    CatalogPrivacyPolicyResponse PrivacyPolicy);

internal sealed record CatalogPrivacyPolicyResponse(
    string ActiveVersion,
    string ResourceUrl,
    string ContentHashSha256,
    DateTime PublishedAtUtc,
    short QuoteRetentionDays);

internal sealed record CatalogProductResponse(
    string Code,
    string Name,
    string Description,
    int CatalogVersion,
    decimal BasePrice,
    string CurrencyCode,
    string PriceDisclaimer,
    string? VisualAssetKey,
    IReadOnlyList<CatalogOptionGroupResponse> OptionGroups,
    IReadOnlyList<CatalogCompatibilityRuleResponse> CompatibilityRules);

internal sealed record CatalogOptionGroupResponse(
    string Code,
    string Name,
    short MinSelections,
    short? MaxSelections,
    int SortOrder,
    IReadOnlyList<CatalogOptionResponse> Options);

internal sealed record CatalogOptionResponse(
    string Code,
    string Name,
    decimal PriceAdjustment,
    string? VisualAssetKey,
    bool IsDefault,
    int SortOrder);

internal sealed record CatalogCompatibilityRuleResponse(
    string Code,
    string Type,
    IReadOnlyList<string> SourceOptionCodes,
    IReadOnlyList<string> TargetOptionCodes,
    string Message);

internal static class ApiContractMapper
{
    public static ProductCatalogResponse Map(ProductDefinition product) =>
        new(
            new(
                product.Company.Slug,
                product.Company.Name,
                product.Company.Locale,
                product.Company.Branding,
                new(
                    product.Company.PrivacyPolicy.ActiveVersion,
                    product.Company.PrivacyPolicy.ResourceUrl,
                    product.Company.PrivacyPolicy.ContentHashSha256
                        .ToLowerInvariant(),
                    product.Company.PrivacyPolicy.PublishedAtUtc,
                    product.Company.PrivacyPolicy.QuoteRetentionDays)),
            new(
                product.Code,
                product.Name,
                product.Description,
                product.CatalogVersion,
                product.BasePrice,
                product.CurrencyCode,
                product.PriceDisclaimer,
                product.VisualAssetKey,
                product.OptionGroups
                    .Where(group => group.IsActive)
                    .OrderBy(group => group.SortOrder)
                    .ThenBy(group => group.Code, StringComparer.Ordinal)
                    .Select(group => new CatalogOptionGroupResponse(
                        group.Code,
                        group.Name,
                        group.MinSelections,
                        group.MaxSelections,
                        group.SortOrder,
                        group.Options
                            .Where(option => option.IsActive)
                            .OrderBy(option => option.SortOrder)
                            .ThenBy(
                                option => option.Code,
                                StringComparer.Ordinal)
                            .Select(option => new CatalogOptionResponse(
                                option.Code,
                                option.Name,
                                option.PriceAdjustment,
                                option.VisualAssetKey,
                                option.IsDefault,
                                option.SortOrder))
                            .ToArray()))
                    .ToArray(),
                product.CompatibilityRules
                    .Where(rule => rule.IsActive)
                    .OrderBy(rule => rule.Code, StringComparer.Ordinal)
                    .Select(rule =>
                        new CatalogCompatibilityRuleResponse(
                            rule.Code,
                            rule.Type,
                            rule.SourceOptionCodes,
                            rule.TargetOptionCodes,
                            rule.Message))
                    .ToArray()));
}

internal sealed record BodyReadResult<T>(
    T? Value,
    ApiResponse<object>? Error)
{
    public bool IsSuccess => Error is null;
}

internal static class PublicBodyReader
{
    public static async Task<BodyReadResult<T>> ReadAsync<T>(
        HttpContext context)
    {
        try
        {
            T? value = await context.Request.ReadFromJsonAsync<T>(
                ApiJson.Options,
                context.RequestAborted);

            return value is null
                ? Invalid<T>(context)
                : new(value, null);
        }
        catch (JsonException)
        {
            return Invalid<T>(context);
        }
        catch (NotSupportedException)
        {
            return Invalid<T>(context);
        }
    }

    private static BodyReadResult<T> Invalid<T>(HttpContext context) =>
        new(
            default,
            ApiEnvelope.Failure<object>(
                context,
                new UseCaseError(
                    "INVALID_REQUEST",
                    "La solicitud JSON no tiene el formato esperado.",
                    null)));
}

public sealed class TechnicalDemoOptions
{
    public const string SectionName = "TechnicalDemo";

    public bool SyntheticContactOnly { get; init; } = true;
}
