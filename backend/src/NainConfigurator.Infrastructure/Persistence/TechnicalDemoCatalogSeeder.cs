using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace NainConfigurator.Infrastructure.Persistence;

public sealed class TechnicalDemoCatalogSeeder(
    IDbContextFactory<NainConfiguratorDbContext> contextFactory)
{
    public async Task SeedAsync(
        string catalogFilePath,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(catalogFilePath);

        await using FileStream stream = File.OpenRead(catalogFilePath);
        TechnicalDemoSeed seed =
            await JsonSerializer.DeserializeAsync<TechnicalDemoSeed>(
                stream,
                JsonSerializerOptions.Web,
                cancellationToken)
            ?? throw new InvalidDataException(
                "The technical demo catalog is empty.");

        ValidateSeed(seed);

        await using NainConfiguratorDbContext context =
            await contextFactory.CreateDbContextAsync(cancellationToken);
        await context.Database.OpenConnectionAsync(cancellationToken);
        bool executionContextReverted = false;

        try
        {
            await context.Database.ExecuteSqlRawAsync(
                "EXECUTE AS USER = 'NainConfiguratorDemoSeeder';",
                cancellationToken);

            await using var transaction =
                await context.Database.BeginTransactionAsync(
                    cancellationToken);

            string[] requestedSlugs = seed.Companies
                .Select(item => item.Slug)
                .ToArray();
            string[] existingSlugs = await context.Companies
                .Where(item => requestedSlugs.Contains(item.Slug))
                .Select(item => item.Slug)
                .ToArrayAsync(cancellationToken);

            if (existingSlugs.Length > 0)
            {
                if (existingSlugs.Length == requestedSlugs.Length)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return;
                }

                throw new InvalidOperationException(
                    "The demo catalog is partially seeded. Reset the approved local demo database before retrying.");
            }

            foreach (DemoCompanySeed companySeed in seed.Companies)
            {
                await SeedCompanyAsync(
                    context,
                    companySeed,
                    cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
        }
        finally
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(
                    "REVERT;",
                    CancellationToken.None);
                executionContextReverted = true;
            }
            finally
            {
                if (!executionContextReverted &&
                    context.Database.GetDbConnection() is
                        Microsoft.Data.SqlClient.SqlConnection connection)
                {
                    Microsoft.Data.SqlClient.SqlConnection.ClearPool(connection);
                }
            }
        }
    }

    private static async Task SeedCompanyAsync(
        NainConfiguratorDbContext context,
        DemoCompanySeed seed,
        CancellationToken cancellationToken)
    {
        var company = new CompanyEntity
        {
            Slug = seed.Slug,
            DisplayName = seed.DisplayName,
            DefaultLocale = seed.DefaultLocale,
        };

        company.BrandProfile = new()
        {
            Version = seed.Branding.Version,
            Mode = seed.Branding.Mode,
            LogoAssetKey = seed.Branding.LogoAssetKey,
            PrimaryColor = seed.Branding.PrimaryColor,
            OnPrimaryColor = seed.Branding.OnPrimaryColor,
            Company = company,
        };

        context.Companies.Add(company);
        await context.SaveChangesAsync(cancellationToken);

        var policy = new CompanyPrivacyPolicyEntity
        {
            CompanyId = company.CompanyId,
            Version = seed.PrivacyPolicy.Version,
            ResourceUrl = seed.PrivacyPolicy.ResourceUrl,
            ContentAssetKey = seed.PrivacyPolicy.ContentAssetKey,
            ContentHashSha256 = SHA256.HashData(
                Encoding.UTF8.GetBytes(seed.PrivacyPolicy.Content)),
            PublishedAtUtc = EnsureUtc(seed.PrivacyPolicy.PublishedAtUtc),
            QuoteRetentionDays = seed.PrivacyPolicy.QuoteRetentionDays,
            Company = company,
        };

        context.CompanyPrivacyPolicies.Add(policy);
        await context.SaveChangesAsync(cancellationToken);

        company.ActivePrivacyPolicyId = policy.CompanyPrivacyPolicyId;
        await context.SaveChangesAsync(cancellationToken);

        foreach (DemoProductSeed productSeed in seed.Products)
        {
            await SeedProductAsync(
                context,
                company,
                productSeed,
                cancellationToken);
        }
    }

    private static async Task SeedProductAsync(
        NainConfiguratorDbContext context,
        CompanyEntity company,
        DemoProductSeed seed,
        CancellationToken cancellationToken)
    {
        var product = new ProductEntity
        {
            CompanyId = company.CompanyId,
            Code = seed.Code,
            Name = seed.Name,
            Description = seed.Description,
            CatalogVersion = seed.CatalogVersion,
            BasePrice = seed.BasePrice,
            CurrencyCode = seed.CurrencyCode,
            PriceDisclaimer = seed.PriceDisclaimer,
            VisualAssetKey = seed.VisualAssetKey,
            IsActive = seed.IsActive,
            IsPublished = seed.IsPublished,
            Company = company,
        };

        foreach (DemoOptionGroupSeed groupSeed in seed.OptionGroups)
        {
            var group = new OptionGroupEntity
            {
                CompanyId = company.CompanyId,
                Code = groupSeed.Code,
                Name = groupSeed.Name,
                MinSelections = groupSeed.MinSelections,
                MaxSelections = groupSeed.MaxSelections,
                IsActive = groupSeed.IsActive,
                SortOrder = groupSeed.SortOrder,
                Product = product,
            };

            foreach (DemoProductOptionSeed optionSeed in groupSeed.Options)
            {
                group.Options.Add(new()
                {
                    CompanyId = company.CompanyId,
                    Code = optionSeed.Code,
                    Name = optionSeed.Name,
                    PriceAdjustment = optionSeed.PriceAdjustment,
                    VisualAssetKey = optionSeed.VisualAssetKey,
                    IsDefault = optionSeed.IsDefault,
                    IsActive = optionSeed.IsActive,
                    SortOrder = optionSeed.SortOrder,
                    Product = product,
                    OptionGroup = group,
                });
            }

            product.OptionGroups.Add(group);
        }

        context.Products.Add(product);
        await context.SaveChangesAsync(cancellationToken);

        Dictionary<string, ProductOptionEntity> optionsByCode =
            product.OptionGroups
                .SelectMany(item => item.Options)
                .ToDictionary(item => item.Code, StringComparer.Ordinal);

        foreach (DemoCompatibilityRuleSeed ruleSeed in seed.CompatibilityRules)
        {
            var rule = new CompatibilityRuleEntity
            {
                CompanyId = company.CompanyId,
                ProductId = product.ProductId,
                Code = ruleSeed.Code,
                Type = ruleSeed.Type,
                Message = ruleSeed.Message,
                IsActive = ruleSeed.IsActive,
                Product = product,
            };

            foreach (string sourceCode in ruleSeed.SourceOptionCodes)
            {
                ProductOptionEntity source = optionsByCode[sourceCode];
                rule.Sources.Add(new()
                {
                    CompanyId = company.CompanyId,
                    ProductId = product.ProductId,
                    ProductOptionId = source.ProductOptionId,
                    Rule = rule,
                    Option = source,
                });
            }

            foreach (string targetCode in ruleSeed.TargetOptionCodes)
            {
                ProductOptionEntity target = optionsByCode[targetCode];
                rule.Targets.Add(new()
                {
                    CompanyId = company.CompanyId,
                    ProductId = product.ProductId,
                    ProductOptionId = target.ProductOptionId,
                    Rule = rule,
                    Option = target,
                });
            }

            context.CompatibilityRules.Add(rule);
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateSeed(TechnicalDemoSeed seed)
    {
        if (seed.Companies.Count < 2)
        {
            throw new InvalidDataException(
                "The technical demo must contain at least two companies and fundamentally different products.");
        }

        string[] duplicateSlugs = seed.Companies
            .GroupBy(item => item.Slug, StringComparer.Ordinal)
            .Where(item => item.Count() > 1)
            .Select(item => item.Key)
            .ToArray();

        if (duplicateSlugs.Length > 0)
        {
            throw new InvalidDataException(
                "Company slugs must be unique.");
        }

        foreach (DemoCompanySeed company in seed.Companies)
        {
            if (company.Products.Count == 0)
            {
                throw new InvalidDataException(
                    "Each demo company must contain at least one product.");
            }

            foreach (DemoProductSeed product in company.Products)
            {
                ValidateProduct(product);
            }
        }
    }

    private static void ValidateProduct(DemoProductSeed product)
    {
        string[] optionCodes = product.OptionGroups
            .SelectMany(item => item.Options)
            .Select(item => item.Code)
            .ToArray();
        var knownOptions = optionCodes.ToHashSet(StringComparer.Ordinal);

        if (knownOptions.Count != optionCodes.Length)
        {
            throw new InvalidDataException(
                "Option codes must be unique inside a product.");
        }

        foreach (DemoCompatibilityRuleSeed rule in product.CompatibilityRules)
        {
            if (!string.Equals(
                    rule.Type,
                    "RequiresAny",
                    StringComparison.Ordinal) ||
                rule.SourceOptionCodes.Count == 0 ||
                rule.TargetOptionCodes.Count == 0 ||
                rule.SourceOptionCodes
                    .Concat(rule.TargetOptionCodes)
                    .Any(code => !knownOptions.Contains(code)))
            {
                throw new InvalidDataException(
                    "The demo catalog contains an unsupported or invalid compatibility rule.");
            }
        }
    }

    private static DateTime EnsureUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);

    private sealed record TechnicalDemoSeed(
        IReadOnlyList<DemoCompanySeed> Companies);

    private sealed record DemoCompanySeed(
        string Slug,
        string DisplayName,
        string DefaultLocale,
        DemoBrandingSeed Branding,
        DemoPrivacyPolicySeed PrivacyPolicy,
        IReadOnlyList<DemoProductSeed> Products);

    private sealed record DemoBrandingSeed(
        int Version,
        string Mode,
        string? LogoAssetKey,
        string PrimaryColor,
        string OnPrimaryColor);

    private sealed record DemoPrivacyPolicySeed(
        string Version,
        string ResourceUrl,
        string ContentAssetKey,
        string Content,
        DateTime PublishedAtUtc,
        short QuoteRetentionDays);

    private sealed record DemoProductSeed(
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
        IReadOnlyList<DemoOptionGroupSeed> OptionGroups,
        IReadOnlyList<DemoCompatibilityRuleSeed> CompatibilityRules);

    private sealed record DemoOptionGroupSeed(
        string Code,
        string Name,
        short MinSelections,
        short? MaxSelections,
        bool IsActive,
        int SortOrder,
        IReadOnlyList<DemoProductOptionSeed> Options);

    private sealed record DemoProductOptionSeed(
        string Code,
        string Name,
        decimal PriceAdjustment,
        string? VisualAssetKey,
        bool IsDefault,
        bool IsActive,
        int SortOrder);

    private sealed record DemoCompatibilityRuleSeed(
        string Code,
        string Type,
        string Message,
        bool IsActive,
        IReadOnlyList<string> SourceOptionCodes,
        IReadOnlyList<string> TargetOptionCodes);
}
