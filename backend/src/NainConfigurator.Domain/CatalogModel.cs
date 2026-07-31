namespace NainConfigurator.Domain;

public sealed record CompanyDefinition(
    string Slug,
    string Name,
    string Locale,
    BrandProfileDefinition? Branding,
    PrivacyPolicyDefinition PrivacyPolicy);

public sealed record BrandProfileDefinition(
    int Version,
    string Mode,
    string? LogoAssetKey,
    string PrimaryColor,
    string OnPrimaryColor);

public sealed record PrivacyPolicyDefinition(
    long InternalId,
    string ActiveVersion,
    string ResourceUrl,
    string ContentHashSha256,
    DateTime PublishedAtUtc,
    short QuoteRetentionDays);

public sealed record ProductDefinition(
    long InternalCompanyId,
    long InternalProductId,
    CompanyDefinition Company,
    string Code,
    string Name,
    string Description,
    int CatalogVersion,
    decimal BasePrice,
    string CurrencyCode,
    string PriceDisclaimer,
    string? VisualAssetKey,
    bool IsActive,
    bool IsPublished,
    IReadOnlyList<OptionGroupDefinition> OptionGroups,
    IReadOnlyList<CompatibilityRuleDefinition> CompatibilityRules);

public sealed record OptionGroupDefinition(
    string Code,
    string Name,
    short MinSelections,
    short? MaxSelections,
    bool IsActive,
    int SortOrder,
    IReadOnlyList<ProductOptionDefinition> Options);

public sealed record ProductOptionDefinition(
    string Code,
    string Name,
    decimal PriceAdjustment,
    string? VisualAssetKey,
    bool IsDefault,
    bool IsActive,
    int SortOrder);

public sealed record CompatibilityRuleDefinition(
    string Code,
    string Type,
    IReadOnlyList<string> SourceOptionCodes,
    IReadOnlyList<string> TargetOptionCodes,
    string Message,
    bool IsActive);

public sealed record NormalizedSelection(
    string OptionGroupCode,
    IReadOnlyList<string> OptionCodes);

public sealed record SelectedOptionSnapshot(
    string OptionGroupCode,
    string OptionGroupName,
    string OptionCode,
    string OptionName,
    decimal PriceAdjustment,
    string? VisualAssetKey);

public sealed record PriceComponent(
    string Type,
    string Code,
    string Name,
    decimal Amount);

public sealed record DomainError(
    string Code,
    string Message,
    string? Target);

public sealed record ConfigurationEvaluation(
    bool IsValid,
    IReadOnlyList<NormalizedSelection> NormalizedSelections,
    IReadOnlyList<SelectedOptionSnapshot> SelectedOptions,
    IReadOnlyList<PriceComponent> PriceBreakdown,
    decimal? EstimatedPrice,
    IReadOnlyList<DomainError> Errors);
