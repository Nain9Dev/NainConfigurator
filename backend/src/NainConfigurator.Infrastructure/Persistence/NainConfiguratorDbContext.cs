using Microsoft.EntityFrameworkCore;

namespace NainConfigurator.Infrastructure.Persistence;

public sealed class NainConfiguratorDbContext(
    DbContextOptions<NainConfiguratorDbContext> options)
    : DbContext(options)
{
    internal DbSet<CompanyEntity> Companies => Set<CompanyEntity>();
    internal DbSet<CompanyBrandProfileEntity> CompanyBrandProfiles =>
        Set<CompanyBrandProfileEntity>();
    internal DbSet<CompanyPrivacyPolicyEntity> CompanyPrivacyPolicies =>
        Set<CompanyPrivacyPolicyEntity>();
    internal DbSet<ProductEntity> Products => Set<ProductEntity>();
    internal DbSet<OptionGroupEntity> OptionGroups => Set<OptionGroupEntity>();
    internal DbSet<ProductOptionEntity> ProductOptions => Set<ProductOptionEntity>();
    internal DbSet<CompatibilityRuleEntity> CompatibilityRules =>
        Set<CompatibilityRuleEntity>();
    internal DbSet<CompatibilityRuleSourceEntity> CompatibilityRuleSources =>
        Set<CompatibilityRuleSourceEntity>();
    internal DbSet<CompatibilityRuleTargetEntity> CompatibilityRuleTargets =>
        Set<CompatibilityRuleTargetEntity>();
    internal DbSet<ConfigurationEntity> Configurations => Set<ConfigurationEntity>();
    internal DbSet<ConfigurationSelectionSnapshotEntity> ConfigurationSelections =>
        Set<ConfigurationSelectionSnapshotEntity>();
    internal DbSet<ConfigurationPriceComponentEntity> ConfigurationPriceComponents =>
        Set<ConfigurationPriceComponentEntity>();
    internal DbSet<QuoteRequestEntity> QuoteRequests => Set<QuoteRequestEntity>();
    internal DbSet<QuoteNotificationOutboxEntity> QuoteNotificationOutbox =>
        Set<QuoteNotificationOutboxEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureCompany(modelBuilder);
        ConfigureBranding(modelBuilder);
        ConfigurePrivacy(modelBuilder);
        ConfigureProduct(modelBuilder);
        ConfigureOptionGroup(modelBuilder);
        ConfigureProductOption(modelBuilder);
        ConfigureCompatibilityRule(modelBuilder);
        ConfigureRuleSources(modelBuilder);
        ConfigureRuleTargets(modelBuilder);
        ConfigureConfiguration(modelBuilder);
        ConfigureSelectionSnapshot(modelBuilder);
        ConfigurePriceComponent(modelBuilder);
        ConfigureQuoteRequest(modelBuilder);
        ConfigureOutbox(modelBuilder);
    }

    private static void ConfigureCompany(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<CompanyEntity>();
        entity.ToTable("Companies", "catalog", table =>
        {
            table.HasCheckConstraint(
                "CK_Companies_SlugFormat",
                "LEN([Slug]) BETWEEN 1 AND 100 AND [Slug] NOT LIKE '%[^a-z0-9-]%' COLLATE Latin1_General_100_BIN2");
            table.HasCheckConstraint(
                "CK_Companies_DisplayNameLength",
                "LEN([DisplayName]) BETWEEN 1 AND 150");
        });
        entity.HasKey(item => item.CompanyId).HasName("PK_Companies");
        entity.Property(item => item.CompanyId).UseIdentityColumn();
        entity.HasAlternateKey(item => item.Slug).HasName("AK_Companies_Slug");
        entity.Property(item => item.Slug)
            .HasMaxLength(100)
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.DisplayName).HasMaxLength(300);
        entity.Property(item => item.DefaultLocale)
            .HasMaxLength(35)
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.RowVersion).IsRowVersion();
    }

    private static void ConfigureBranding(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<CompanyBrandProfileEntity>();
        entity.ToTable("CompanyBrandProfiles", "catalog", table =>
        {
            table.HasCheckConstraint("CK_CompanyBrandProfiles_Version", "[Version] > 0");
            table.HasCheckConstraint(
                "CK_CompanyBrandProfiles_Mode",
                "[Mode] = 'CoBranded'");
            table.HasCheckConstraint(
                "CK_CompanyBrandProfiles_Colors",
                "[PrimaryColor] LIKE '#[0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F]' COLLATE Latin1_General_100_BIN2 AND [OnPrimaryColor] LIKE '#[0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F]' COLLATE Latin1_General_100_BIN2");
        });
        entity.HasKey(item => item.CompanyBrandProfileId)
            .HasName("PK_CompanyBrandProfiles");
        entity.HasIndex(item => item.CompanyId)
            .IsUnique()
            .HasDatabaseName("UQ_CompanyBrandProfiles_CompanyId");
        entity.HasIndex(item => new { item.CompanyId, item.CompanyBrandProfileId })
            .IsUnique()
            .HasDatabaseName("UQ_CompanyBrandProfiles_Company_Profile");
        entity.Property(item => item.Mode)
            .HasMaxLength(20)
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.LogoAssetKey).HasMaxLength(400);
        entity.Property(item => item.PrimaryColor)
            .HasMaxLength(7)
            .IsFixedLength()
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.OnPrimaryColor)
            .HasMaxLength(7)
            .IsFixedLength()
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.RowVersion).IsRowVersion();
        entity.HasOne(item => item.Company)
            .WithOne(item => item.BrandProfile)
            .HasForeignKey<CompanyBrandProfileEntity>(item => item.CompanyId)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_CompanyBrandProfiles_Companies");
    }

    private static void ConfigurePrivacy(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<CompanyPrivacyPolicyEntity>();
        entity.ToTable("CompanyPrivacyPolicies", "catalog", table =>
        {
            table.HasCheckConstraint(
                "CK_CompanyPrivacyPolicies_ResourceUrl",
                "LEN([ResourceUrl]) BETWEEN 1 AND 2048 AND [ResourceUrl] LIKE 'https://%'");
            table.HasCheckConstraint(
                "CK_CompanyPrivacyPolicies_Retention",
                "[QuoteRetentionDays] BETWEEN 30 AND 1825");
        });
        entity.HasKey(item => item.CompanyPrivacyPolicyId)
            .HasName("PK_CompanyPrivacyPolicies");
        entity.HasAlternateKey(item => new
        {
            item.CompanyPrivacyPolicyId,
            item.CompanyId,
        }).HasName("AK_CompanyPrivacyPolicies_Policy_Company");
        entity.HasIndex(item => new { item.CompanyId, item.Version })
            .IsUnique()
            .HasDatabaseName("UQ_CompanyPrivacyPolicies_Company_Version");
        entity.Property(item => item.Version)
            .HasMaxLength(200)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.ResourceUrl)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.ContentAssetKey).HasMaxLength(400);
        entity.Property(item => item.ContentHashSha256).HasMaxLength(32).IsFixedLength();
        entity.Property(item => item.PublishedAtUtc).HasPrecision(3);
        entity.HasOne(item => item.Company)
            .WithMany(item => item.PrivacyPolicies)
            .HasForeignKey(item => item.CompanyId)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_CompanyPrivacyPolicies_Companies");

        modelBuilder.Entity<CompanyEntity>()
            .HasOne(item => item.ActivePrivacyPolicy)
            .WithMany()
            .HasForeignKey(item => new
            {
                item.ActivePrivacyPolicyId,
                item.CompanyId,
            })
            .HasPrincipalKey(item => new
            {
                item.CompanyPrivacyPolicyId,
                item.CompanyId,
            })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_Companies_ActivePrivacyPolicy");
    }

    private static void ConfigureProduct(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<ProductEntity>();
        entity.ToTable("Products", "catalog", table =>
        {
            table.HasCheckConstraint(
                "CK_Products_Code",
                "LEN([Code]) BETWEEN 1 AND 50 AND [Code] NOT LIKE '%[^A-Z0-9_-]%' COLLATE Latin1_General_100_BIN2");
            table.HasCheckConstraint("CK_Products_BasePrice", "[BasePrice] >= 0");
            table.HasCheckConstraint(
                "CK_Products_Currency",
                "[CurrencyCode] LIKE '[A-Z][A-Z][A-Z]' COLLATE Latin1_General_100_BIN2");
            table.HasCheckConstraint(
                "CK_Products_PublishedVersion",
                "[IsPublished] = 0 OR [CatalogVersion] > 0");
        });
        entity.HasKey(item => item.ProductId).HasName("PK_Products");
        entity.HasAlternateKey(item => new { item.CompanyId, item.ProductId })
            .HasName("AK_Products_Company_Product");
        entity.HasIndex(item => new { item.CompanyId, item.Code })
            .IsUnique()
            .HasDatabaseName("UQ_Products_Company_Code");
        entity.Property(item => item.Code)
            .HasMaxLength(50)
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.Name).HasMaxLength(300);
        entity.Property(item => item.Description).HasMaxLength(4000);
        entity.Property(item => item.BasePrice).HasPrecision(19, 2);
        entity.Property(item => item.CurrencyCode)
            .HasMaxLength(3)
            .IsFixedLength()
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.PriceDisclaimer).HasMaxLength(1000);
        entity.Property(item => item.VisualAssetKey).HasMaxLength(400);
        entity.Property(item => item.RowVersion).IsRowVersion();
        entity.HasOne(item => item.Company)
            .WithMany(item => item.Products)
            .HasForeignKey(item => item.CompanyId)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_Products_Companies");
    }

    private static void ConfigureOptionGroup(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<OptionGroupEntity>();
        entity.ToTable("OptionGroups", "catalog", table =>
        {
            table.HasCheckConstraint(
                "CK_OptionGroups_SelectionLimits",
                "[MinSelections] >= 0 AND ([MaxSelections] IS NULL OR ([MaxSelections] BETWEEN 1 AND 500 AND [MinSelections] <= [MaxSelections]))");
        });
        entity.HasKey(item => item.OptionGroupId).HasName("PK_OptionGroups");
        entity.HasAlternateKey(item => new
        {
            item.CompanyId,
            item.ProductId,
            item.OptionGroupId,
        }).HasName("AK_OptionGroups_Company_Product_Group");
        entity.HasIndex(item => new { item.CompanyId, item.ProductId, item.Code })
            .IsUnique()
            .HasDatabaseName("UQ_OptionGroups_Company_Product_Code");
        ConfigureCatalogCode(entity.Property(item => item.Code));
        entity.Property(item => item.Name).HasMaxLength(300);
        entity.Property(item => item.RowVersion).IsRowVersion();
        entity.HasOne(item => item.Product)
            .WithMany(item => item.OptionGroups)
            .HasForeignKey(item => new { item.CompanyId, item.ProductId })
            .HasPrincipalKey(item => new { item.CompanyId, item.ProductId })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_OptionGroups_Products");
    }

    private static void ConfigureProductOption(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<ProductOptionEntity>();
        entity.ToTable("ProductOptions", "catalog", table =>
        {
            table.HasCheckConstraint(
                "CK_ProductOptions_PriceAdjustment",
                "[PriceAdjustment] >= 0");
        });
        entity.HasKey(item => item.ProductOptionId).HasName("PK_ProductOptions");
        entity.HasAlternateKey(item => new
        {
            item.CompanyId,
            item.ProductId,
            item.ProductOptionId,
        }).HasName("AK_ProductOptions_Company_Product_Option");
        entity.HasIndex(item => new { item.CompanyId, item.ProductId, item.Code })
            .IsUnique()
            .HasDatabaseName("UQ_ProductOptions_Company_Product_Code");
        ConfigureCatalogCode(entity.Property(item => item.Code));
        entity.Property(item => item.Name).HasMaxLength(300);
        entity.Property(item => item.PriceAdjustment).HasPrecision(19, 2);
        entity.Property(item => item.VisualAssetKey).HasMaxLength(400);
        entity.Property(item => item.RowVersion).IsRowVersion();
        entity.HasOne(item => item.OptionGroup)
            .WithMany(item => item.Options)
            .HasForeignKey(item => new
            {
                item.CompanyId,
                item.ProductId,
                item.OptionGroupId,
            })
            .HasPrincipalKey(item => new
            {
                item.CompanyId,
                item.ProductId,
                item.OptionGroupId,
            })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_ProductOptions_OptionGroups");
        entity.HasOne(item => item.Product)
            .WithMany(item => item.Options)
            .HasForeignKey(item => new { item.CompanyId, item.ProductId })
            .HasPrincipalKey(item => new { item.CompanyId, item.ProductId })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_ProductOptions_Products");
    }

    private static void ConfigureCompatibilityRule(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<CompatibilityRuleEntity>();
        entity.ToTable("CompatibilityRules", "catalog", table =>
        {
            table.HasCheckConstraint(
                "CK_CompatibilityRules_Type",
                "[Type] = 'RequiresAny'");
        });
        entity.HasKey(item => item.CompatibilityRuleId)
            .HasName("PK_CompatibilityRules");
        entity.HasAlternateKey(item => new
        {
            item.CompanyId,
            item.ProductId,
            item.CompatibilityRuleId,
        }).HasName("AK_CompatibilityRules_Company_Product_Rule");
        entity.HasIndex(item => new { item.CompanyId, item.ProductId, item.Code })
            .IsUnique()
            .HasDatabaseName("UQ_CompatibilityRules_Company_Product_Code");
        ConfigureCatalogCode(entity.Property(item => item.Code));
        entity.Property(item => item.Type)
            .HasMaxLength(32)
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.Message).HasMaxLength(1000);
        entity.Property(item => item.RowVersion).IsRowVersion();
        entity.HasOne(item => item.Product)
            .WithMany(item => item.CompatibilityRules)
            .HasForeignKey(item => new { item.CompanyId, item.ProductId })
            .HasPrincipalKey(item => new { item.CompanyId, item.ProductId })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_CompatibilityRules_Products");
    }

    private static void ConfigureRuleSources(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<CompatibilityRuleSourceEntity>();
        entity.ToTable("CompatibilityRuleSources", "catalog");
        entity.HasKey(item => new
        {
            item.CompanyId,
            item.CompatibilityRuleId,
            item.ProductOptionId,
        }).HasName("PK_CompatibilityRuleSources");
        entity.HasOne(item => item.Rule)
            .WithMany(item => item.Sources)
            .HasForeignKey(item => new
            {
                item.CompanyId,
                item.ProductId,
                item.CompatibilityRuleId,
            })
            .HasPrincipalKey(item => new
            {
                item.CompanyId,
                item.ProductId,
                item.CompatibilityRuleId,
            })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_CompatibilityRuleSources_Rules");
        entity.HasOne(item => item.Option)
            .WithMany()
            .HasForeignKey(item => new
            {
                item.CompanyId,
                item.ProductId,
                item.ProductOptionId,
            })
            .HasPrincipalKey(item => new
            {
                item.CompanyId,
                item.ProductId,
                item.ProductOptionId,
            })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_CompatibilityRuleSources_Options");
    }

    private static void ConfigureRuleTargets(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<CompatibilityRuleTargetEntity>();
        entity.ToTable("CompatibilityRuleTargets", "catalog");
        entity.HasKey(item => new
        {
            item.CompanyId,
            item.CompatibilityRuleId,
            item.ProductOptionId,
        }).HasName("PK_CompatibilityRuleTargets");
        entity.HasOne(item => item.Rule)
            .WithMany(item => item.Targets)
            .HasForeignKey(item => new
            {
                item.CompanyId,
                item.ProductId,
                item.CompatibilityRuleId,
            })
            .HasPrincipalKey(item => new
            {
                item.CompanyId,
                item.ProductId,
                item.CompatibilityRuleId,
            })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_CompatibilityRuleTargets_Rules");
        entity.HasOne(item => item.Option)
            .WithMany()
            .HasForeignKey(item => new
            {
                item.CompanyId,
                item.ProductId,
                item.ProductOptionId,
            })
            .HasPrincipalKey(item => new
            {
                item.CompanyId,
                item.ProductId,
                item.ProductOptionId,
            })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_CompatibilityRuleTargets_Options");
    }

    private static void ConfigureConfiguration(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<ConfigurationEntity>();
        entity.ToTable("Configurations", "sales", table =>
        {
            table.HasCheckConstraint(
                "CK_Configurations_Code",
                "LEN([ConfigurationCode]) = 28 AND [ConfigurationCode] LIKE 'NCF-%' AND SUBSTRING([ConfigurationCode], 5, 24) NOT LIKE '%[^0-9A-F]%' COLLATE Latin1_General_100_BIN2");
            table.HasCheckConstraint(
                "CK_Configurations_VisualState",
                "([VisualStateJson] IS NULL AND [VisualStateSchemaVersion] IS NULL) OR ([VisualStateJson] IS NOT NULL AND [VisualStateSchemaVersion] = 1 AND ISJSON([VisualStateJson]) = 1 AND DATALENGTH([VisualStateJson]) <= 32768)");
            table.HasCheckConstraint(
                "CK_Configurations_Prices",
                "[ProductBasePriceSnapshot] >= 0 AND [EstimatedPrice] >= 0");
        });
        entity.HasKey(item => item.ConfigurationId).HasName("PK_Configurations");
        entity.HasAlternateKey(item => new { item.CompanyId, item.ConfigurationId })
            .HasName("AK_Configurations_Company_Configuration");
        entity.HasIndex(item => item.ConfigurationCode)
            .IsUnique()
            .HasDatabaseName("UQ_Configurations_Code");
        entity.HasIndex(item => new
        {
            item.CompanyId,
            item.ProductId,
            item.ClientRequestId,
        }).IsUnique().HasDatabaseName("UQ_Configurations_Idempotency");
        ConfigurePublicCode(entity.Property(item => item.ConfigurationCode));
        entity.Property(item => item.IdempotencyFingerprint)
            .HasMaxLength(32)
            .IsFixedLength();
        ConfigureCatalogCode(entity.Property(item => item.CompanySlugSnapshot), 100, false);
        entity.Property(item => item.CompanyNameSnapshot).HasMaxLength(300);
        ConfigureCatalogCode(entity.Property(item => item.ProductCodeSnapshot));
        entity.Property(item => item.ProductNameSnapshot).HasMaxLength(300);
        entity.Property(item => item.ProductBasePriceSnapshot).HasPrecision(19, 2);
        ConfigureCatalogCode(entity.Property(item => item.ContentLocale), 35, false);
        entity.Property(item => item.CurrencyCode)
            .HasMaxLength(3)
            .IsFixedLength()
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.EstimatedPrice).HasPrecision(19, 2);
        entity.Property(item => item.VisualStateJson)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.CreatedAtUtc).HasPrecision(3);
        entity.HasOne(item => item.Product)
            .WithMany()
            .HasForeignKey(item => new { item.CompanyId, item.ProductId })
            .HasPrincipalKey(item => new { item.CompanyId, item.ProductId })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_Configurations_Products");
    }

    private static void ConfigureSelectionSnapshot(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<ConfigurationSelectionSnapshotEntity>();
        entity.ToTable("ConfigurationSelectionSnapshots", "sales", table =>
        {
            table.HasCheckConstraint(
                "CK_ConfigurationSelectionSnapshots_Position",
                "[NormalizedPosition] BETWEEN 0 AND 499");
            table.HasCheckConstraint(
                "CK_ConfigurationSelectionSnapshots_Amount",
                "[PriceAdjustmentSnapshot] >= 0");
        });
        entity.HasKey(item => item.ConfigurationSelectionSnapshotId)
            .HasName("PK_ConfigurationSelectionSnapshots");
        entity.HasIndex(item => new
        {
            item.CompanyId,
            item.ConfigurationId,
            item.NormalizedPosition,
        }).IsUnique().HasDatabaseName("UQ_ConfigurationSelections_Position");
        entity.HasIndex(item => new
        {
            item.CompanyId,
            item.ConfigurationId,
            item.OptionCodeSnapshot,
        }).IsUnique().HasDatabaseName("UQ_ConfigurationSelections_Option");
        ConfigureCatalogCode(entity.Property(item => item.OptionGroupCodeSnapshot));
        entity.Property(item => item.OptionGroupNameSnapshot).HasMaxLength(300);
        ConfigureCatalogCode(entity.Property(item => item.OptionCodeSnapshot));
        entity.Property(item => item.OptionNameSnapshot).HasMaxLength(300);
        entity.Property(item => item.PriceAdjustmentSnapshot).HasPrecision(19, 2);
        entity.Property(item => item.VisualAssetKeySnapshot).HasMaxLength(400);
        entity.HasOne(item => item.Configuration)
            .WithMany(item => item.Selections)
            .HasForeignKey(item => new { item.CompanyId, item.ConfigurationId })
            .HasPrincipalKey(item => new { item.CompanyId, item.ConfigurationId })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_ConfigurationSelections_Configurations");
    }

    private static void ConfigurePriceComponent(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<ConfigurationPriceComponentEntity>();
        entity.ToTable("ConfigurationPriceComponents", "sales", table =>
        {
            table.HasCheckConstraint(
                "CK_ConfigurationPriceComponents_Type",
                "[Type] IN ('BasePrice', 'OptionAdjustment')");
            table.HasCheckConstraint(
                "CK_ConfigurationPriceComponents_Position",
                "[Position] BETWEEN 0 AND 500 AND ([Type] <> 'BasePrice' OR [Position] = 0)");
            table.HasCheckConstraint(
                "CK_ConfigurationPriceComponents_Amount",
                "[Amount] >= 0");
        });
        entity.HasKey(item => item.ConfigurationPriceComponentId)
            .HasName("PK_ConfigurationPriceComponents");
        entity.HasIndex(item => new
        {
            item.CompanyId,
            item.ConfigurationId,
            item.Position,
        }).IsUnique().HasDatabaseName("UQ_ConfigurationPriceComponents_Position");
        entity.HasIndex(item => new { item.CompanyId, item.ConfigurationId })
            .IsUnique()
            .HasFilter("[Type] = 'BasePrice'")
            .HasDatabaseName("UQ_ConfigurationPriceComponents_Base");
        entity.Property(item => item.Type)
            .HasMaxLength(32)
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        ConfigureCatalogCode(entity.Property(item => item.CodeSnapshot));
        entity.Property(item => item.NameSnapshot).HasMaxLength(300);
        entity.Property(item => item.Amount).HasPrecision(19, 2);
        entity.HasOne(item => item.Configuration)
            .WithMany(item => item.PriceComponents)
            .HasForeignKey(item => new { item.CompanyId, item.ConfigurationId })
            .HasPrincipalKey(item => new { item.CompanyId, item.ConfigurationId })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_ConfigurationPriceComponents_Configurations");
    }

    private static void ConfigureQuoteRequest(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<QuoteRequestEntity>();
        entity.ToTable("QuoteRequests", "sales", table =>
        {
            table.HasCheckConstraint(
                "CK_QuoteRequests_Code",
                "LEN([QuoteRequestCode]) = 28 AND [QuoteRequestCode] LIKE 'NQR-%' AND SUBSTRING([QuoteRequestCode], 5, 24) NOT LIKE '%[^0-9A-F]%' COLLATE Latin1_General_100_BIN2");
            table.HasCheckConstraint("CK_QuoteRequests_Status", "[Status] = 'New'");
            table.HasCheckConstraint(
                "CK_QuoteRequests_Acknowledgment",
                "[PrivacyNoticeAcknowledged] = 1");
            table.HasCheckConstraint(
                "CK_QuoteRequests_Retention",
                "[RetentionUntilUtc] > [CreatedAtUtc]");
            table.HasCheckConstraint(
                "CK_QuoteRequests_LegalHold",
                "([LegalHoldStartedAtUtc] IS NULL AND [LegalHoldReviewAtUtc] IS NULL AND [LegalHoldUntilUtc] IS NULL AND [LegalHoldOwnerRef] IS NULL AND [LegalHoldReasonCode] IS NULL AND [LegalHoldTicketRef] IS NULL) OR ([LegalHoldStartedAtUtc] IS NOT NULL AND [LegalHoldReviewAtUtc] IS NOT NULL AND [LegalHoldUntilUtc] IS NOT NULL AND [LegalHoldOwnerRef] IS NOT NULL AND [LegalHoldReasonCode] IS NOT NULL AND [LegalHoldTicketRef] IS NOT NULL)");
        });
        entity.HasKey(item => item.QuoteRequestId).HasName("PK_QuoteRequests");
        entity.HasAlternateKey(item => new { item.CompanyId, item.QuoteRequestId })
            .HasName("AK_QuoteRequests_Company_Quote");
        entity.HasIndex(item => item.QuoteRequestCode)
            .IsUnique()
            .HasDatabaseName("UQ_QuoteRequests_Code");
        entity.HasIndex(item => new { item.CompanyId, item.ClientRequestId })
            .IsUnique()
            .HasDatabaseName("UQ_QuoteRequests_Idempotency");
        ConfigurePublicCode(entity.Property(item => item.QuoteRequestCode));
        entity.Property(item => item.IdempotencyFingerprint)
            .HasMaxLength(32)
            .IsFixedLength();
        entity.Property(item => item.Status)
            .HasMaxLength(20)
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.ContactName).HasMaxLength(300);
        entity.Property(item => item.ContactEmail)
            .HasMaxLength(508)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.ContactPhone).HasMaxLength(60);
        entity.Property(item => item.Message).HasMaxLength(2000);
        entity.Property(item => item.AcknowledgedPrivacyPolicyVersion)
            .HasMaxLength(200)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.AcknowledgedPrivacyContentHash)
            .HasMaxLength(32)
            .IsFixedLength();
        entity.Property(item => item.PrivacyNoticeAcknowledgedAtUtc).HasPrecision(3);
        entity.Property(item => item.RetentionUntilUtc).HasPrecision(3);
        entity.Property(item => item.CreatedAtUtc).HasPrecision(3);
        entity.Property(item => item.RowVersion).IsRowVersion();
        entity.HasOne(item => item.Configuration)
            .WithMany()
            .HasForeignKey(item => new { item.CompanyId, item.ConfigurationId })
            .HasPrincipalKey(item => new { item.CompanyId, item.ConfigurationId })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_QuoteRequests_Configurations");
        entity.HasOne(item => item.PrivacyPolicy)
            .WithMany()
            .HasForeignKey(item => new
            {
                item.CompanyPrivacyPolicyId,
                item.CompanyId,
            })
            .HasPrincipalKey(item => new
            {
                item.CompanyPrivacyPolicyId,
                item.CompanyId,
            })
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_QuoteRequests_PrivacyPolicies");
    }

    private static void ConfigureOutbox(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<QuoteNotificationOutboxEntity>();
        entity.ToTable("QuoteNotificationOutbox", "operations", table =>
        {
            table.HasCheckConstraint(
                "CK_QuoteNotificationOutbox_Attempts",
                "[AttemptCount] >= 0");
            table.HasCheckConstraint(
                "CK_QuoteNotificationOutbox_Lease",
                "([LeaseOwnerId] IS NULL AND [LeaseExpiresAtUtc] IS NULL) OR ([LeaseOwnerId] IS NOT NULL AND [LeaseExpiresAtUtc] IS NOT NULL)");
            table.HasCheckConstraint(
                "CK_QuoteNotificationOutbox_CompletedLease",
                "[CompletedAtUtc] IS NULL OR ([LeaseOwnerId] IS NULL AND [LeaseExpiresAtUtc] IS NULL)");
        });
        entity.HasKey(item => item.QuoteNotificationOutboxId)
            .HasName("PK_QuoteNotificationOutbox");
        entity.HasIndex(item => item.NotificationIntentId)
            .IsUnique()
            .HasDatabaseName("UQ_QuoteNotificationOutbox_Intent");
        entity.HasIndex(item => new { item.CompanyId, item.QuoteRequestId })
            .IsUnique()
            .HasDatabaseName("UQ_QuoteNotificationOutbox_Quote");
        entity.Property(item => item.CreatedAtUtc).HasPrecision(3);
        entity.Property(item => item.AvailableAtUtc).HasPrecision(3);
        entity.Property(item => item.LastFailureCode)
            .HasMaxLength(100)
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
        entity.Property(item => item.RowVersion).IsRowVersion();
        entity.HasOne(item => item.QuoteRequest)
            .WithOne(item => item.Outbox)
            .HasForeignKey<QuoteNotificationOutboxEntity>(item => new
            {
                item.CompanyId,
                item.QuoteRequestId,
            })
            .HasPrincipalKey<QuoteRequestEntity>(item => new
            {
                item.CompanyId,
                item.QuoteRequestId,
            })
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_QuoteNotificationOutbox_QuoteRequests");
    }

    private static void ConfigureCatalogCode(
        Microsoft.EntityFrameworkCore.Metadata.Builders.PropertyBuilder<string> property,
        int maximumLength = 50,
        bool uppercase = true)
    {
        property
            .HasMaxLength(maximumLength)
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
    }

    private static void ConfigurePublicCode(
        Microsoft.EntityFrameworkCore.Metadata.Builders.PropertyBuilder<string> property)
    {
        property
            .HasMaxLength(28)
            .IsFixedLength()
            .IsUnicode(false)
            .UseCollation("Latin1_General_100_BIN2");
    }
}
