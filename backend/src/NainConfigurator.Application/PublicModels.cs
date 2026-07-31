using NainConfigurator.Domain;

namespace NainConfigurator.Application;

public enum UseCaseStatus
{
    Ok,
    Created,
    Existing,
    InvalidRequest,
    NotFound,
    Conflict,
    Unprocessable,
}

public sealed record UseCaseError(
    string Code,
    string Message,
    string? Target);

public sealed record UseCaseResult<T>(
    UseCaseStatus Status,
    T? Data,
    IReadOnlyList<UseCaseError> Errors,
    object? ConflictData = null)
{
    public bool IsSuccess =>
        Status is UseCaseStatus.Ok or UseCaseStatus.Created or UseCaseStatus.Existing;
}

public static class UseCaseResults
{
    public static UseCaseResult<T> Success<T>(
        T data,
        UseCaseStatus status = UseCaseStatus.Ok) =>
        new(status, data, Array.Empty<UseCaseError>());

    public static UseCaseResult<T> Failure<T>(
        UseCaseStatus status,
        params UseCaseError[] errors) =>
        new(status, default, errors);
}

public sealed record ValidateConfigurationCommand(
    string CompanySlug,
    string ProductCode,
    int CatalogVersion,
    IReadOnlyList<string> SelectedOptionCodes);

public sealed record CreateConfigurationCommand(
    Guid ClientRequestId,
    string CompanySlug,
    string ProductCode,
    int CatalogVersion,
    IReadOnlyList<string> SelectedOptionCodes,
    VisualState? VisualState);

public sealed record VisualState(
    short SchemaVersion,
    CameraState Camera);

public sealed record CameraState(
    Vector3State Position,
    Vector3State Rotation);

public sealed record Vector3State(
    decimal X,
    decimal Y,
    decimal Z);

public sealed record ValidateConfigurationData(
    bool IsValid,
    int CatalogVersion,
    string ContentLocale,
    decimal? EstimatedPrice,
    string CurrencyCode,
    IReadOnlyList<NormalizedSelection>? NormalizedSelections = null,
    IReadOnlyList<PriceComponent>? PriceBreakdown = null);

public sealed record CreateConfigurationData(
    string ConfigurationCode,
    string CompanySlug,
    string ProductCode,
    int CatalogVersionAtCreation,
    string ContentLocale,
    decimal EstimatedPrice,
    string CurrencyCode,
    DateTime CreatedAtUtc,
    bool WasExisting);

public sealed record SavedConfigurationData(
    string ConfigurationCode,
    string ContentLocale,
    SavedCompanyData Company,
    SavedProductData Product,
    IReadOnlyList<SelectedOptionSnapshot> SelectedOptions,
    IReadOnlyList<PriceComponent> PriceBreakdown,
    decimal EstimatedPrice,
    string CurrencyCode,
    VisualState? VisualState,
    DateTime CreatedAtUtc,
    bool IsCurrentProductAvailable);

public sealed record SavedCompanyData(
    string Slug,
    string Name,
    BrandProfileDefinition? Branding);

public sealed record SavedProductData(
    string Code,
    string Name,
    int CatalogVersionAtCreation);

public sealed record CreateQuoteRequestCommand(
    Guid ClientRequestId,
    string ConfigurationCode,
    QuoteContact Contact,
    string? Message,
    PrivacyAcknowledgment PrivacyPolicy);

public sealed record QuoteContact(
    string Name,
    string Email,
    string? Phone);

public sealed record PrivacyAcknowledgment(
    bool Acknowledged,
    string Version);

public sealed record NormalizedQuoteIntent(
    Guid ClientRequestId,
    string ConfigurationCode,
    string ContactName,
    string ContactEmail,
    string? ContactPhone,
    string? Message,
    bool PrivacyAcknowledged,
    string PrivacyPolicyVersion);

public sealed record CreateQuoteRequestData(
    string QuoteRequestCode,
    string ConfigurationCode,
    string Status,
    DateTime CreatedAtUtc,
    DateTime RetentionUntilUtc,
    bool WasExisting);

public sealed record CatalogVersionConflictData(
    int RequestedCatalogVersion,
    int CurrentCatalogVersion);
