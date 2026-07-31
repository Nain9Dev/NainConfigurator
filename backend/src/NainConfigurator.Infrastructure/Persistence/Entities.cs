namespace NainConfigurator.Infrastructure.Persistence;

internal sealed class CompanyEntity
{
    public long CompanyId { get; set; }
    public required string Slug { get; set; }
    public required string DisplayName { get; set; }
    public required string DefaultLocale { get; set; }
    public long? ActivePrivacyPolicyId { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public CompanyBrandProfileEntity? BrandProfile { get; set; }
    public CompanyPrivacyPolicyEntity? ActivePrivacyPolicy { get; set; }
    public List<CompanyPrivacyPolicyEntity> PrivacyPolicies { get; } = [];
    public List<ProductEntity> Products { get; } = [];
}

internal sealed class CompanyBrandProfileEntity
{
    public long CompanyBrandProfileId { get; set; }
    public long CompanyId { get; set; }
    public int Version { get; set; }
    public required string Mode { get; set; }
    public string? LogoAssetKey { get; set; }
    public required string PrimaryColor { get; set; }
    public required string OnPrimaryColor { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public CompanyEntity Company { get; set; } = null!;
}

internal sealed class CompanyPrivacyPolicyEntity
{
    public long CompanyPrivacyPolicyId { get; set; }
    public long CompanyId { get; set; }
    public required string Version { get; set; }
    public required string ResourceUrl { get; set; }
    public required string ContentAssetKey { get; set; }
    public byte[] ContentHashSha256 { get; set; } = [];
    public DateTime PublishedAtUtc { get; set; }
    public short QuoteRetentionDays { get; set; }
    public CompanyEntity Company { get; set; } = null!;
}

internal sealed class ProductEntity
{
    public long ProductId { get; set; }
    public long CompanyId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public int CatalogVersion { get; set; }
    public decimal BasePrice { get; set; }
    public required string CurrencyCode { get; set; }
    public required string PriceDisclaimer { get; set; }
    public string? VisualAssetKey { get; set; }
    public bool IsActive { get; set; }
    public bool IsPublished { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public CompanyEntity Company { get; set; } = null!;
    public List<OptionGroupEntity> OptionGroups { get; } = [];
    public List<ProductOptionEntity> Options { get; } = [];
    public List<CompatibilityRuleEntity> CompatibilityRules { get; } = [];
}

internal sealed class OptionGroupEntity
{
    public long OptionGroupId { get; set; }
    public long CompanyId { get; set; }
    public long ProductId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public short MinSelections { get; set; }
    public short? MaxSelections { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public ProductEntity Product { get; set; } = null!;
    public List<ProductOptionEntity> Options { get; } = [];
}

internal sealed class ProductOptionEntity
{
    public long ProductOptionId { get; set; }
    public long CompanyId { get; set; }
    public long ProductId { get; set; }
    public long OptionGroupId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public decimal PriceAdjustment { get; set; }
    public string? VisualAssetKey { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public ProductEntity Product { get; set; } = null!;
    public OptionGroupEntity OptionGroup { get; set; } = null!;
}

internal sealed class CompatibilityRuleEntity
{
    public long CompatibilityRuleId { get; set; }
    public long CompanyId { get; set; }
    public long ProductId { get; set; }
    public required string Code { get; set; }
    public required string Type { get; set; }
    public required string Message { get; set; }
    public bool IsActive { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public ProductEntity Product { get; set; } = null!;
    public List<CompatibilityRuleSourceEntity> Sources { get; } = [];
    public List<CompatibilityRuleTargetEntity> Targets { get; } = [];
}

internal sealed class CompatibilityRuleSourceEntity
{
    public long CompanyId { get; set; }
    public long ProductId { get; set; }
    public long CompatibilityRuleId { get; set; }
    public long ProductOptionId { get; set; }
    public CompatibilityRuleEntity Rule { get; set; } = null!;
    public ProductOptionEntity Option { get; set; } = null!;
}

internal sealed class CompatibilityRuleTargetEntity
{
    public long CompanyId { get; set; }
    public long ProductId { get; set; }
    public long CompatibilityRuleId { get; set; }
    public long ProductOptionId { get; set; }
    public CompatibilityRuleEntity Rule { get; set; } = null!;
    public ProductOptionEntity Option { get; set; } = null!;
}

internal sealed class ConfigurationEntity
{
    public long ConfigurationId { get; set; }
    public required string ConfigurationCode { get; set; }
    public Guid ClientRequestId { get; set; }
    public byte[] IdempotencyFingerprint { get; set; } = [];
    public byte FingerprintVersion { get; set; }
    public long CompanyId { get; set; }
    public long ProductId { get; set; }
    public int CatalogVersionAtCreation { get; set; }
    public required string CompanySlugSnapshot { get; set; }
    public required string CompanyNameSnapshot { get; set; }
    public required string ProductCodeSnapshot { get; set; }
    public required string ProductNameSnapshot { get; set; }
    public decimal ProductBasePriceSnapshot { get; set; }
    public required string ContentLocale { get; set; }
    public required string CurrencyCode { get; set; }
    public decimal EstimatedPrice { get; set; }
    public short? VisualStateSchemaVersion { get; set; }
    public string? VisualStateJson { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public ProductEntity Product { get; set; } = null!;
    public List<ConfigurationSelectionSnapshotEntity> Selections { get; } = [];
    public List<ConfigurationPriceComponentEntity> PriceComponents { get; } = [];
}

internal sealed class ConfigurationSelectionSnapshotEntity
{
    public long ConfigurationSelectionSnapshotId { get; set; }
    public long CompanyId { get; set; }
    public long ConfigurationId { get; set; }
    public short NormalizedPosition { get; set; }
    public required string OptionGroupCodeSnapshot { get; set; }
    public required string OptionGroupNameSnapshot { get; set; }
    public required string OptionCodeSnapshot { get; set; }
    public required string OptionNameSnapshot { get; set; }
    public decimal PriceAdjustmentSnapshot { get; set; }
    public string? VisualAssetKeySnapshot { get; set; }
    public ConfigurationEntity Configuration { get; set; } = null!;
}

internal sealed class ConfigurationPriceComponentEntity
{
    public long ConfigurationPriceComponentId { get; set; }
    public long CompanyId { get; set; }
    public long ConfigurationId { get; set; }
    public short Position { get; set; }
    public required string Type { get; set; }
    public required string CodeSnapshot { get; set; }
    public required string NameSnapshot { get; set; }
    public decimal Amount { get; set; }
    public ConfigurationEntity Configuration { get; set; } = null!;
}

internal sealed class QuoteRequestEntity
{
    public long QuoteRequestId { get; set; }
    public required string QuoteRequestCode { get; set; }
    public Guid ClientRequestId { get; set; }
    public byte[] IdempotencyFingerprint { get; set; } = [];
    public byte FingerprintVersion { get; set; }
    public long CompanyId { get; set; }
    public long ConfigurationId { get; set; }
    public required string Status { get; set; }
    public required string ContactName { get; set; }
    public required string ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Message { get; set; }
    public long CompanyPrivacyPolicyId { get; set; }
    public bool PrivacyNoticeAcknowledged { get; set; }
    public required string AcknowledgedPrivacyPolicyVersion { get; set; }
    public byte[] AcknowledgedPrivacyContentHash { get; set; } = [];
    public DateTime PrivacyNoticeAcknowledgedAtUtc { get; set; }
    public DateTime RetentionUntilUtc { get; set; }
    public DateTime? LegalHoldStartedAtUtc { get; set; }
    public DateTime? LegalHoldReviewAtUtc { get; set; }
    public DateTime? LegalHoldUntilUtc { get; set; }
    public string? LegalHoldOwnerRef { get; set; }
    public string? LegalHoldReasonCode { get; set; }
    public string? LegalHoldTicketRef { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public ConfigurationEntity Configuration { get; set; } = null!;
    public CompanyPrivacyPolicyEntity PrivacyPolicy { get; set; } = null!;
    public QuoteNotificationOutboxEntity Outbox { get; set; } = null!;
}

internal sealed class QuoteNotificationOutboxEntity
{
    public long QuoteNotificationOutboxId { get; set; }
    public Guid NotificationIntentId { get; set; }
    public long CompanyId { get; set; }
    public long QuoteRequestId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime AvailableAtUtc { get; set; }
    public short AttemptCount { get; set; }
    public Guid? LeaseOwnerId { get; set; }
    public DateTime? LeaseExpiresAtUtc { get; set; }
    public DateTime? LastAttemptAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? LastFailureCode { get; set; }
    public byte[] RowVersion { get; set; } = [];
    public QuoteRequestEntity QuoteRequest { get; set; } = null!;
}
