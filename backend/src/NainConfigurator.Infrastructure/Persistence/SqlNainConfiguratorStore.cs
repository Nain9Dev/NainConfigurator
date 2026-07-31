using System.Data;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using NainConfigurator.Application;
using NainConfigurator.Domain;

namespace NainConfigurator.Infrastructure.Persistence;

public sealed class SqlNainConfiguratorStore(
    IDbContextFactory<NainConfiguratorDbContext> contextFactory,
    IClock clock,
    IPublicCodeGenerator codeGenerator,
    IPersistenceFaultInjector faultInjector)
    : INainConfiguratorStore
{
    private const byte FingerprintVersion = 1;
    private const int MaximumCreateAttempts = 5;

    public async Task<ProductDefinition?> GetPublishedProductAsync(
        string companySlug,
        string productCode,
        CancellationToken cancellationToken)
    {
        await using SqlServerCompanyScope? scope =
            await SqlServerCompanyScope.OpenByCompanySlugAsync(
                contextFactory,
                companySlug,
                cancellationToken);

        if (scope is null)
        {
            return null;
        }

        ProductDefinition? product = CatalogEntityMapper.Map(
            await LoadProductAsync(
                scope.Context,
                scope.CompanyId,
                productCode,
                cancellationToken));

        return product is { IsActive: true, IsPublished: true }
            ? product
            : null;
    }

    public async Task<ProductDefinition?> GetProductForValidationAsync(
        string companySlug,
        string productCode,
        CancellationToken cancellationToken)
    {
        await using SqlServerCompanyScope? scope =
            await SqlServerCompanyScope.OpenByCompanySlugAsync(
                contextFactory,
                companySlug,
                cancellationToken);

        if (scope is null)
        {
            return null;
        }

        return CatalogEntityMapper.Map(
            await LoadProductAsync(
                scope.Context,
                scope.CompanyId,
                productCode,
                cancellationToken));
    }

    public async Task<UseCaseResult<CreateConfigurationData>>
        CreateConfigurationAsync(
            CreateConfigurationCommand command,
            string? canonicalVisualStateJson,
            Func<ProductDefinition, ConfigurationEvaluation> evaluate,
            CancellationToken cancellationToken)
    {
        for (int attempt = 1; attempt <= MaximumCreateAttempts; attempt++)
        {
            try
            {
                return await CreateConfigurationAttemptAsync(
                    command,
                    canonicalVisualStateJson,
                    evaluate,
                    cancellationToken);
            }
            catch (PublicCodeCollisionException)
                when (attempt < MaximumCreateAttempts)
            {
            }
            catch (Exception exception)
                when (ContainsSqlError(exception, 1205) &&
                      attempt < MaximumCreateAttempts)
            {
            }
            catch (IdempotencyRaceException)
            {
                return await ResolveConfigurationRaceAsync(
                    command,
                    canonicalVisualStateJson,
                    cancellationToken);
            }
        }

        throw new InvalidOperationException(
            "A unique configuration code could not be generated.");
    }

    public async Task<SavedConfigurationData?> GetConfigurationAsync(
        string configurationCode,
        CancellationToken cancellationToken)
    {
        await using SqlServerCompanyScope? scope =
            await SqlServerCompanyScope.OpenByConfigurationCodeAsync(
                contextFactory,
                configurationCode,
                cancellationToken);

        if (scope?.ConfigurationId is not long configurationId)
        {
            return null;
        }

        ConfigurationEntity? configuration = await scope.Context.Configurations
            .AsNoTracking()
            .AsSplitQuery()
            .Include(item => item.Selections)
            .Include(item => item.PriceComponents)
            .Include(item => item.Product)
                .ThenInclude(item => item.Company)
                    .ThenInclude(item => item.BrandProfile)
            .SingleOrDefaultAsync(
                item =>
                    item.CompanyId == scope.CompanyId &&
                    item.ConfigurationId == configurationId,
                cancellationToken);

        return configuration is null
            ? null
            : MapSavedConfiguration(configuration);
    }

    public async Task<UseCaseResult<CreateQuoteRequestData>>
        CreateQuoteRequestAsync(
            NormalizedQuoteIntent intent,
            CancellationToken cancellationToken)
    {
        for (int attempt = 1; attempt <= MaximumCreateAttempts; attempt++)
        {
            try
            {
                return await CreateQuoteRequestAttemptAsync(
                    intent,
                    cancellationToken);
            }
            catch (PublicCodeCollisionException)
                when (attempt < MaximumCreateAttempts)
            {
            }
            catch (Exception exception)
                when (ContainsSqlError(exception, 1205) &&
                      attempt < MaximumCreateAttempts)
            {
            }
            catch (IdempotencyRaceException)
            {
                return await ResolveQuoteRaceAsync(
                    intent,
                    cancellationToken);
            }
        }

        throw new InvalidOperationException(
            "A unique quote request code could not be generated.");
    }

    private async Task<UseCaseResult<CreateConfigurationData>>
        CreateConfigurationAttemptAsync(
            CreateConfigurationCommand command,
            string? canonicalVisualStateJson,
            Func<ProductDefinition, ConfigurationEvaluation> evaluate,
            CancellationToken cancellationToken)
    {
        await using SqlServerCompanyScope? scope =
            await SqlServerCompanyScope.OpenByCompanySlugAsync(
                contextFactory,
                command.CompanySlug,
                cancellationToken);

        if (scope is null)
        {
            return ProductNotFound();
        }

        await using var transaction =
            await scope.Context.Database.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);

        ProductEntity? productEntity = await scope.Context.Products
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item =>
                    item.CompanyId == scope.CompanyId &&
                    item.Code == command.ProductCode,
                cancellationToken);

        if (productEntity is null)
        {
            return ProductNotFound();
        }

        ConfigurationEntity? existing =
            await LoadConfigurationByRequestIdAsync(
                scope.Context,
                scope.CompanyId,
                productEntity.ProductId,
                command.ClientRequestId,
                cancellationToken);

        if (existing is not null)
        {
            return CompareConfigurationReplay(
                existing,
                command,
                canonicalVisualStateJson);
        }

        productEntity = await scope.Context.Products
            .FromSqlInterpolated(
                $"""
                SELECT *
                FROM [catalog].[Products] WITH (UPDLOCK, HOLDLOCK)
                WHERE [CompanyId] = {scope.CompanyId}
                  AND [ProductId] = {productEntity.ProductId}
                """)
            .SingleOrDefaultAsync(cancellationToken);

        if (productEntity is null)
        {
            return ProductNotFound();
        }

        existing = await LoadConfigurationByRequestIdAsync(
            scope.Context,
            scope.CompanyId,
            productEntity.ProductId,
            command.ClientRequestId,
            cancellationToken);

        if (existing is not null)
        {
            return CompareConfigurationReplay(
                existing,
                command,
                canonicalVisualStateJson);
        }

        ProductDefinition? product = CatalogEntityMapper.Map(
            await LoadProductAsync(
                scope.Context,
                scope.CompanyId,
                command.ProductCode,
                cancellationToken));

        if (product is null)
        {
            return ProductNotFound();
        }

        if (!product.IsActive || !product.IsPublished)
        {
            return UseCaseResults.Failure<CreateConfigurationData>(
                UseCaseStatus.Unprocessable,
                new UseCaseError(
                    "PRODUCT_NOT_AVAILABLE",
                    "El producto solicitado no está disponible.",
                    "productCode"));
        }

        if (command.CatalogVersion != product.CatalogVersion)
        {
            return new(
                UseCaseStatus.Conflict,
                null,
                [
                    new(
                        "CATALOG_VERSION_OUTDATED",
                        "El catálogo del producto ha cambiado. Vuelve a cargarlo antes de continuar.",
                        "catalogVersion"),
                ],
                new CatalogVersionConflictData(
                    command.CatalogVersion,
                    product.CatalogVersion));
        }

        ConfigurationEvaluation evaluation = evaluate(product);

        if (!evaluation.IsValid)
        {
            return new(
                evaluation.Errors.Any(
                    error => error.Code == "DUPLICATE_OPTION_CODE")
                    ? UseCaseStatus.InvalidRequest
                    : UseCaseStatus.Unprocessable,
                null,
                evaluation.Errors
                    .Select(error => new UseCaseError(
                        error.Code,
                        error.Message,
                        error.Target))
                    .ToArray());
        }

        DateTime createdAtUtc = EnsureUtc(clock.UtcNow);
        byte[] fingerprint = IdempotencyFingerprint.CreateConfiguration(
            command,
            canonicalVisualStateJson);
        var configuration = new ConfigurationEntity
        {
            ConfigurationCode = codeGenerator.CreateConfigurationCode(),
            ClientRequestId = command.ClientRequestId,
            IdempotencyFingerprint = fingerprint,
            FingerprintVersion = FingerprintVersion,
            CompanyId = product.InternalCompanyId,
            ProductId = product.InternalProductId,
            CatalogVersionAtCreation = product.CatalogVersion,
            CompanySlugSnapshot = product.Company.Slug,
            CompanyNameSnapshot = product.Company.Name,
            ProductCodeSnapshot = product.Code,
            ProductNameSnapshot = product.Name,
            ProductBasePriceSnapshot = product.BasePrice,
            ContentLocale = product.Company.Locale,
            CurrencyCode = product.CurrencyCode,
            EstimatedPrice = evaluation.EstimatedPrice!.Value,
            VisualStateSchemaVersion =
                canonicalVisualStateJson is null ? null : (short)1,
            VisualStateJson = canonicalVisualStateJson,
            CreatedAtUtc = createdAtUtc,
        };

        for (int index = 0; index < evaluation.SelectedOptions.Count; index++)
        {
            SelectedOptionSnapshot selected = evaluation.SelectedOptions[index];
            configuration.Selections.Add(new()
            {
                CompanyId = product.InternalCompanyId,
                NormalizedPosition = checked((short)index),
                OptionGroupCodeSnapshot = selected.OptionGroupCode,
                OptionGroupNameSnapshot = selected.OptionGroupName,
                OptionCodeSnapshot = selected.OptionCode,
                OptionNameSnapshot = selected.OptionName,
                PriceAdjustmentSnapshot = selected.PriceAdjustment,
                VisualAssetKeySnapshot = selected.VisualAssetKey,
            });
        }

        for (int index = 0; index < evaluation.PriceBreakdown.Count; index++)
        {
            PriceComponent component = evaluation.PriceBreakdown[index];
            configuration.PriceComponents.Add(new()
            {
                CompanyId = product.InternalCompanyId,
                Position = checked((short)index),
                Type = component.Type,
                CodeSnapshot = component.Code,
                NameSnapshot = component.Name,
                Amount = component.Amount,
            });
        }

        scope.Context.Configurations.Add(configuration);

        try
        {
            await scope.Context.SaveChangesAsync(cancellationToken);
            await faultInjector.OnConfigurationPersistedBeforeCommitAsync(
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (IsUniqueConstraint(exception, "UQ_Configurations_Code"))
        {
            throw new PublicCodeCollisionException(exception);
        }
        catch (DbUpdateException exception)
            when (IsUniqueConstraint(
                exception,
                "UQ_Configurations_Idempotency"))
        {
            throw new IdempotencyRaceException(exception);
        }

        return UseCaseResults.Success(
            MapCreatedConfiguration(configuration, wasExisting: false),
            UseCaseStatus.Created);
    }

    private async Task<UseCaseResult<CreateConfigurationData>>
        ResolveConfigurationRaceAsync(
            CreateConfigurationCommand command,
            string? canonicalVisualStateJson,
            CancellationToken cancellationToken)
    {
        await using SqlServerCompanyScope? scope =
            await SqlServerCompanyScope.OpenByCompanySlugAsync(
                contextFactory,
                command.CompanySlug,
                cancellationToken);

        if (scope is null)
        {
            return ProductNotFound();
        }

        ProductEntity? product = await scope.Context.Products
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item =>
                    item.CompanyId == scope.CompanyId &&
                    item.Code == command.ProductCode,
                cancellationToken);

        if (product is null)
        {
            return ProductNotFound();
        }

        ConfigurationEntity? existing =
            await LoadConfigurationByRequestIdAsync(
                scope.Context,
                scope.CompanyId,
                product.ProductId,
                command.ClientRequestId,
                cancellationToken);

        if (existing is null)
        {
            throw new InvalidOperationException(
                "The idempotent configuration could not be reloaded.");
        }

        return CompareConfigurationReplay(
            existing,
            command,
            canonicalVisualStateJson);
    }

    private async Task<UseCaseResult<CreateQuoteRequestData>>
        CreateQuoteRequestAttemptAsync(
            NormalizedQuoteIntent intent,
            CancellationToken cancellationToken)
    {
        await using SqlServerCompanyScope? scope =
            await SqlServerCompanyScope.OpenByConfigurationCodeAsync(
                contextFactory,
                intent.ConfigurationCode,
                cancellationToken);

        if (scope?.ConfigurationId is not long configurationId)
        {
            return ConfigurationNotFound();
        }

        await using var transaction =
            await scope.Context.Database.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);

        QuoteRequestEntity? existing = await scope.Context.QuoteRequests
            .AsNoTracking()
            .Include(item => item.Configuration)
            .SingleOrDefaultAsync(
                item =>
                    item.CompanyId == scope.CompanyId &&
                    item.ClientRequestId == intent.ClientRequestId,
                cancellationToken);

        if (existing is not null)
        {
            return CompareQuoteReplay(existing, intent);
        }

        var configurationScope = await scope.Context.Configurations
            .AsNoTracking()
            .Where(item =>
                item.CompanyId == scope.CompanyId &&
                item.ConfigurationId == configurationId)
            .Select(item => new
            {
                item.ProductId,
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (configurationScope is null)
        {
            return ConfigurationNotFound();
        }

        ProductEntity? lockedProduct = await scope.Context.Products
            .FromSqlInterpolated(
                $"""
                SELECT *
                FROM [catalog].[Products] WITH (UPDLOCK, HOLDLOCK)
                WHERE [CompanyId] = {scope.CompanyId}
                  AND [ProductId] = {configurationScope.ProductId}
                """)
            .SingleOrDefaultAsync(cancellationToken);

        CompanyEntity? lockedCompany = await scope.Context.Companies
            .FromSqlInterpolated(
                $"""
                SELECT *
                FROM [catalog].[Companies] WITH (UPDLOCK, HOLDLOCK)
                WHERE [CompanyId] = {scope.CompanyId}
                """)
            .SingleOrDefaultAsync(cancellationToken);

        if (lockedProduct is null || lockedCompany is null)
        {
            return ConfigurationNotFound();
        }

        existing = await scope.Context.QuoteRequests
            .AsNoTracking()
            .Include(item => item.Configuration)
            .SingleOrDefaultAsync(
                item =>
                    item.CompanyId == scope.CompanyId &&
                    item.ClientRequestId == intent.ClientRequestId,
                cancellationToken);

        if (existing is not null)
        {
            return CompareQuoteReplay(existing, intent);
        }

        ConfigurationEntity? configuration = await scope.Context.Configurations
            .Include(item => item.Product)
                .ThenInclude(item => item.Company)
                    .ThenInclude(item => item.ActivePrivacyPolicy)
            .SingleOrDefaultAsync(
                item =>
                    item.CompanyId == scope.CompanyId &&
                    item.ConfigurationId == configurationId,
                cancellationToken);

        if (configuration is null)
        {
            return ConfigurationNotFound();
        }

        if (!configuration.Product.IsActive ||
            !configuration.Product.IsPublished)
        {
            return UseCaseResults.Failure<CreateQuoteRequestData>(
                UseCaseStatus.Unprocessable,
                new UseCaseError(
                    "PRODUCT_NOT_AVAILABLE",
                    "El producto configurado no está disponible para nuevas solicitudes de presupuesto.",
                    "configurationCode"));
        }

        CompanyPrivacyPolicyEntity? policy =
            configuration.Product.Company.ActivePrivacyPolicy;

        if (policy is null ||
            !string.Equals(
                policy.Version,
                intent.PrivacyPolicyVersion,
                StringComparison.Ordinal))
        {
            return UseCaseResults.Failure<CreateQuoteRequestData>(
                UseCaseStatus.Conflict,
                new UseCaseError(
                    "PRIVACY_POLICY_VERSION_OUTDATED",
                    "La política de privacidad ha cambiado. Vuelve a leerla antes de continuar.",
                    "privacyPolicy.version"));
        }

        DateTime createdAtUtc = EnsureUtc(clock.UtcNow);
        var quote = new QuoteRequestEntity
        {
            QuoteRequestCode = codeGenerator.CreateQuoteRequestCode(),
            ClientRequestId = intent.ClientRequestId,
            IdempotencyFingerprint =
                IdempotencyFingerprint.CreateQuote(intent),
            FingerprintVersion = FingerprintVersion,
            CompanyId = scope.CompanyId,
            ConfigurationId = configuration.ConfigurationId,
            Status = "New",
            ContactName = intent.ContactName,
            ContactEmail = intent.ContactEmail,
            ContactPhone = intent.ContactPhone,
            Message = intent.Message,
            CompanyPrivacyPolicyId = policy.CompanyPrivacyPolicyId,
            PrivacyNoticeAcknowledged = intent.PrivacyAcknowledged,
            AcknowledgedPrivacyPolicyVersion = policy.Version,
            AcknowledgedPrivacyContentHash =
                policy.ContentHashSha256.ToArray(),
            PrivacyNoticeAcknowledgedAtUtc = createdAtUtc,
            RetentionUntilUtc =
                createdAtUtc.AddDays(policy.QuoteRetentionDays),
            CreatedAtUtc = createdAtUtc,
            Configuration = configuration,
            PrivacyPolicy = policy,
        };

        quote.Outbox = new()
        {
            NotificationIntentId = Guid.NewGuid(),
            CompanyId = scope.CompanyId,
            CreatedAtUtc = createdAtUtc,
            AvailableAtUtc = createdAtUtc,
            AttemptCount = 0,
        };

        scope.Context.QuoteRequests.Add(quote);

        try
        {
            await scope.Context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (IsUniqueConstraint(exception, "UQ_QuoteRequests_Code"))
        {
            throw new PublicCodeCollisionException(exception);
        }
        catch (DbUpdateException exception)
            when (IsUniqueConstraint(
                exception,
                "UQ_QuoteRequests_Idempotency"))
        {
            throw new IdempotencyRaceException(exception);
        }

        return UseCaseResults.Success(
            MapCreatedQuote(quote, wasExisting: false),
            UseCaseStatus.Created);
    }

    private async Task<UseCaseResult<CreateQuoteRequestData>>
        ResolveQuoteRaceAsync(
            NormalizedQuoteIntent intent,
            CancellationToken cancellationToken)
    {
        await using SqlServerCompanyScope? scope =
            await SqlServerCompanyScope.OpenByConfigurationCodeAsync(
                contextFactory,
                intent.ConfigurationCode,
                cancellationToken);

        if (scope is null)
        {
            return ConfigurationNotFound();
        }

        QuoteRequestEntity? existing = await scope.Context.QuoteRequests
            .AsNoTracking()
            .Include(item => item.Configuration)
            .SingleOrDefaultAsync(
                item =>
                    item.CompanyId == scope.CompanyId &&
                    item.ClientRequestId == intent.ClientRequestId,
                cancellationToken);

        if (existing is null)
        {
            throw new InvalidOperationException(
                "The idempotent quote request could not be reloaded.");
        }

        return CompareQuoteReplay(existing, intent);
    }

    private static Task<ProductEntity?> LoadProductAsync(
        NainConfiguratorDbContext context,
        long companyId,
        string productCode,
        CancellationToken cancellationToken) =>
        context.Products
            .AsNoTracking()
            .AsSplitQuery()
            .Include(item => item.Company)
                .ThenInclude(item => item.BrandProfile)
            .Include(item => item.Company)
                .ThenInclude(item => item.ActivePrivacyPolicy)
            .Include(item => item.OptionGroups)
                .ThenInclude(item => item.Options)
            .Include(item => item.CompatibilityRules)
                .ThenInclude(item => item.Sources)
                    .ThenInclude(item => item.Option)
            .Include(item => item.CompatibilityRules)
                .ThenInclude(item => item.Targets)
                    .ThenInclude(item => item.Option)
            .SingleOrDefaultAsync(
                item =>
                    item.CompanyId == companyId &&
                    item.Code == productCode,
                cancellationToken);

    private static Task<ConfigurationEntity?> LoadConfigurationByRequestIdAsync(
        NainConfiguratorDbContext context,
        long companyId,
        long productId,
        Guid clientRequestId,
        CancellationToken cancellationToken) =>
        context.Configurations
            .AsNoTracking()
            .Include(item => item.Selections)
            .SingleOrDefaultAsync(
                item =>
                    item.CompanyId == companyId &&
                    item.ProductId == productId &&
                    item.ClientRequestId == clientRequestId,
                cancellationToken);

    private static UseCaseResult<CreateConfigurationData>
        CompareConfigurationReplay(
            ConfigurationEntity existing,
            CreateConfigurationCommand command,
            string? canonicalVisualStateJson)
    {
        byte[] expectedFingerprint =
            IdempotencyFingerprint.CreateConfiguration(
                command,
                canonicalVisualStateJson);

        string[] requestedOptionCodes = command.SelectedOptionCodes
            .OrderBy(item => item, StringComparer.Ordinal)
            .ToArray();
        string[] existingOptionCodes = existing.Selections
            .Select(item => item.OptionCodeSnapshot)
            .OrderBy(item => item, StringComparer.Ordinal)
            .ToArray();

        bool isExactReplay =
            existing.FingerprintVersion == FingerprintVersion &&
            CryptographicOperations.FixedTimeEquals(
                existing.IdempotencyFingerprint,
                expectedFingerprint) &&
            string.Equals(
                existing.CompanySlugSnapshot,
                command.CompanySlug,
                StringComparison.Ordinal) &&
            string.Equals(
                existing.ProductCodeSnapshot,
                command.ProductCode,
                StringComparison.Ordinal) &&
            existing.CatalogVersionAtCreation == command.CatalogVersion &&
            string.Equals(
                existing.VisualStateJson,
                canonicalVisualStateJson,
                StringComparison.Ordinal) &&
            existingOptionCodes.SequenceEqual(
                requestedOptionCodes,
                StringComparer.Ordinal);

        if (!isExactReplay)
        {
            return IdempotencyConflict<CreateConfigurationData>();
        }

        return UseCaseResults.Success(
            MapCreatedConfiguration(existing, wasExisting: true),
            UseCaseStatus.Existing);
    }

    private static UseCaseResult<CreateQuoteRequestData> CompareQuoteReplay(
        QuoteRequestEntity existing,
        NormalizedQuoteIntent intent)
    {
        byte[] expectedFingerprint =
            IdempotencyFingerprint.CreateQuote(intent);

        bool isExactReplay =
            existing.FingerprintVersion == FingerprintVersion &&
            CryptographicOperations.FixedTimeEquals(
                existing.IdempotencyFingerprint,
                expectedFingerprint) &&
            string.Equals(
                existing.Configuration.ConfigurationCode,
                intent.ConfigurationCode,
                StringComparison.Ordinal) &&
            string.Equals(
                existing.ContactName,
                intent.ContactName,
                StringComparison.Ordinal) &&
            string.Equals(
                existing.ContactEmail,
                intent.ContactEmail,
                StringComparison.Ordinal) &&
            string.Equals(
                existing.ContactPhone,
                intent.ContactPhone,
                StringComparison.Ordinal) &&
            string.Equals(
                existing.Message,
                intent.Message,
                StringComparison.Ordinal) &&
            existing.PrivacyNoticeAcknowledged ==
                intent.PrivacyAcknowledged &&
            string.Equals(
                existing.AcknowledgedPrivacyPolicyVersion,
                intent.PrivacyPolicyVersion,
                StringComparison.Ordinal);

        if (!isExactReplay)
        {
            return IdempotencyConflict<CreateQuoteRequestData>();
        }

        return UseCaseResults.Success(
            MapCreatedQuote(existing, wasExisting: true),
            UseCaseStatus.Existing);
    }

    private static CreateConfigurationData MapCreatedConfiguration(
        ConfigurationEntity configuration,
        bool wasExisting) =>
        new(
            configuration.ConfigurationCode,
            configuration.CompanySlugSnapshot,
            configuration.ProductCodeSnapshot,
            configuration.CatalogVersionAtCreation,
            configuration.ContentLocale,
            configuration.EstimatedPrice,
            configuration.CurrencyCode,
            EnsureUtc(configuration.CreatedAtUtc),
            wasExisting);

    private static CreateQuoteRequestData MapCreatedQuote(
        QuoteRequestEntity quote,
        bool wasExisting) =>
        new(
            quote.QuoteRequestCode,
            quote.Configuration.ConfigurationCode,
            quote.Status,
            EnsureUtc(quote.CreatedAtUtc),
            EnsureUtc(quote.RetentionUntilUtc),
            wasExisting);

    private static SavedConfigurationData MapSavedConfiguration(
        ConfigurationEntity configuration)
    {
        CompanyBrandProfileEntity? brand =
            configuration.Product.Company.BrandProfile;
        BrandProfileDefinition? branding = brand is null
            ? null
            : new(
                brand.Version,
                brand.Mode,
                brand.LogoAssetKey,
                brand.PrimaryColor,
                brand.OnPrimaryColor);

        VisualState? visualState = configuration.VisualStateJson is null
            ? null
            : JsonSerializer.Deserialize<VisualState>(
                configuration.VisualStateJson,
                JsonSerializerOptions.Web);

        return new(
            configuration.ConfigurationCode,
            configuration.ContentLocale,
            new(
                configuration.CompanySlugSnapshot,
                configuration.CompanyNameSnapshot,
                branding),
            new(
                configuration.ProductCodeSnapshot,
                configuration.ProductNameSnapshot,
                configuration.CatalogVersionAtCreation),
            configuration.Selections
                .OrderBy(item => item.NormalizedPosition)
                .Select(item => new SelectedOptionSnapshot(
                    item.OptionGroupCodeSnapshot,
                    item.OptionGroupNameSnapshot,
                    item.OptionCodeSnapshot,
                    item.OptionNameSnapshot,
                    item.PriceAdjustmentSnapshot,
                    item.VisualAssetKeySnapshot))
                .ToArray(),
            configuration.PriceComponents
                .OrderBy(item => item.Position)
                .Select(item => new PriceComponent(
                    item.Type,
                    item.CodeSnapshot,
                    item.NameSnapshot,
                    item.Amount))
                .ToArray(),
            configuration.EstimatedPrice,
            configuration.CurrencyCode,
            visualState,
            EnsureUtc(configuration.CreatedAtUtc),
            configuration.Product.IsActive &&
                configuration.Product.IsPublished);
    }

    private static bool IsUniqueConstraint(
        DbUpdateException exception,
        string constraintName) =>
        exception.InnerException is SqlException
        {
            Number: 2601 or 2627,
        } sqlException &&
        sqlException.Message.Contains(
            constraintName,
            StringComparison.Ordinal);

    private static bool ContainsSqlError(
        Exception exception,
        int errorNumber)
    {
        for (Exception? current = exception;
             current is not null;
             current = current.InnerException)
        {
            if (current is SqlException sqlException &&
                sqlException.Number == errorNumber)
            {
                return true;
            }
        }

        return false;
    }

    private static DateTime EnsureUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);

    private static UseCaseResult<T> IdempotencyConflict<T>() =>
        UseCaseResults.Failure<T>(
            UseCaseStatus.Conflict,
            new UseCaseError(
                "CLIENT_REQUEST_ID_REUSED",
                "El identificador de solicitud ya se utilizó con datos diferentes.",
                "clientRequestId"));

    private static UseCaseResult<CreateConfigurationData> ProductNotFound() =>
        UseCaseResults.Failure<CreateConfigurationData>(
            UseCaseStatus.NotFound,
            new UseCaseError(
                "PRODUCT_NOT_FOUND",
                "El producto solicitado no existe.",
                "productCode"));

    private static UseCaseResult<CreateQuoteRequestData>
        ConfigurationNotFound() =>
        UseCaseResults.Failure<CreateQuoteRequestData>(
            UseCaseStatus.NotFound,
            new UseCaseError(
                "CONFIGURATION_NOT_FOUND",
                "La configuración seleccionada no existe.",
                "configurationCode"));

    private sealed class PublicCodeCollisionException(Exception innerException)
        : Exception(
            "A generated public code collided with an existing code.",
            innerException);

    private sealed class IdempotencyRaceException(Exception innerException)
        : Exception(
            "A concurrent idempotent request committed first.",
            innerException);
}
