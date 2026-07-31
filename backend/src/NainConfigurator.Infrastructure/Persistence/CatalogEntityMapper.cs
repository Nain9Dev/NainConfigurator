using NainConfigurator.Domain;

namespace NainConfigurator.Infrastructure.Persistence;

internal static class CatalogEntityMapper
{
    public static ProductDefinition? Map(ProductEntity? product)
    {
        if (product is null)
        {
            return null;
        }

        CompanyPrivacyPolicyEntity? policy = product.Company.ActivePrivacyPolicy;

        if (policy is null)
        {
            return null;
        }

        BrandProfileDefinition? branding = product.Company.BrandProfile is null
            ? null
            : new(
                product.Company.BrandProfile.Version,
                product.Company.BrandProfile.Mode,
                product.Company.BrandProfile.LogoAssetKey,
                product.Company.BrandProfile.PrimaryColor,
                product.Company.BrandProfile.OnPrimaryColor);

        var company = new CompanyDefinition(
            product.Company.Slug,
            product.Company.DisplayName,
            product.Company.DefaultLocale,
            branding,
            new PrivacyPolicyDefinition(
                policy.CompanyPrivacyPolicyId,
                policy.Version,
                policy.ResourceUrl,
                Convert.ToHexString(policy.ContentHashSha256),
                EnsureUtc(policy.PublishedAtUtc),
                policy.QuoteRetentionDays));

        OptionGroupDefinition[] groups = product.OptionGroups
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Code, StringComparer.Ordinal)
            .Select(group => new OptionGroupDefinition(
                group.Code,
                group.Name,
                group.MinSelections,
                group.MaxSelections,
                group.IsActive,
                group.SortOrder,
                group.Options
                    .OrderBy(item => item.SortOrder)
                    .ThenBy(item => item.Code, StringComparer.Ordinal)
                    .Select(option => new ProductOptionDefinition(
                        option.Code,
                        option.Name,
                        option.PriceAdjustment,
                        option.VisualAssetKey,
                        option.IsDefault,
                        option.IsActive,
                        option.SortOrder))
                    .ToArray()))
            .ToArray();

        CompatibilityRuleDefinition[] rules = product.CompatibilityRules
            .OrderBy(item => item.Code, StringComparer.Ordinal)
            .Select(rule => new CompatibilityRuleDefinition(
                rule.Code,
                rule.Type,
                rule.Sources
                    .Select(item => item.Option.Code)
                    .OrderBy(item => item, StringComparer.Ordinal)
                    .ToArray(),
                rule.Targets
                    .Select(item => item.Option.Code)
                    .OrderBy(item => item, StringComparer.Ordinal)
                    .ToArray(),
                rule.Message,
                rule.IsActive))
            .ToArray();

        return new(
            product.CompanyId,
            product.ProductId,
            company,
            product.Code,
            product.Name,
            product.Description,
            product.CatalogVersion,
            product.BasePrice,
            product.CurrencyCode,
            product.PriceDisclaimer,
            product.VisualAssetKey,
            product.IsActive,
            product.IsPublished,
            groups,
            rules);
    }

    private static DateTime EnsureUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
