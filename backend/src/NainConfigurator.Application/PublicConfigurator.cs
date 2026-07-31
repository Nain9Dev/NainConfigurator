using System.Net.Mail;
using System.Text;
using NainConfigurator.Domain;

namespace NainConfigurator.Application;

public sealed class PublicConfigurator(INainConfiguratorStore store)
{
    public Task<ProductDefinition?> GetPublishedProductAsync(
        string companySlug,
        string productCode,
        CancellationToken cancellationToken) =>
        store.GetPublishedProductAsync(
            companySlug,
            productCode,
            cancellationToken);

    public async Task<UseCaseResult<ValidateConfigurationData>> ValidateAsync(
        ValidateConfigurationCommand command,
        CancellationToken cancellationToken)
    {
        UseCaseError[] shapeErrors = ValidateConfigurationShape(
            command.CompanySlug,
            command.ProductCode,
            command.CatalogVersion,
            command.SelectedOptionCodes);

        if (shapeErrors.Length > 0)
        {
            return new(
                UseCaseStatus.InvalidRequest,
                null,
                shapeErrors);
        }

        ProductDefinition? product = await store.GetProductForValidationAsync(
            command.CompanySlug,
            command.ProductCode,
            cancellationToken);

        if (product is null)
        {
            return UseCaseResults.Failure<ValidateConfigurationData>(
                UseCaseStatus.NotFound,
                new UseCaseError(
                    "PRODUCT_NOT_FOUND",
                    "El producto solicitado no existe.",
                    "productCode"));
        }

        if (!product.IsActive || !product.IsPublished)
        {
            return UseCaseResults.Failure<ValidateConfigurationData>(
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

        ConfigurationEvaluation evaluation = ConfigurationEvaluator.Evaluate(
            product,
            command.SelectedOptionCodes);

        var data = new ValidateConfigurationData(
            evaluation.IsValid,
            product.CatalogVersion,
            product.Company.Locale,
            evaluation.EstimatedPrice,
            product.CurrencyCode,
            evaluation.IsValid ? evaluation.NormalizedSelections : null,
            evaluation.IsValid ? evaluation.PriceBreakdown : null);

        if (!evaluation.IsValid)
        {
            return new(
                evaluation.Errors.Any(
                    error => error.Code == "DUPLICATE_OPTION_CODE")
                    ? UseCaseStatus.InvalidRequest
                    : UseCaseStatus.Unprocessable,
                data,
                evaluation.Errors.Select(MapError).ToArray());
        }

        return UseCaseResults.Success(data);
    }

    public async Task<UseCaseResult<CreateConfigurationData>> CreateConfigurationAsync(
        CreateConfigurationCommand command,
        CancellationToken cancellationToken)
    {
        var shapeErrors = new List<UseCaseError>();

        if (command.ClientRequestId == Guid.Empty)
        {
            shapeErrors.Add(new(
                "INVALID_REQUEST",
                "El identificador de solicitud debe ser un GUID válido.",
                "clientRequestId"));
        }

        shapeErrors.AddRange(ValidateConfigurationShape(
            command.CompanySlug,
            command.ProductCode,
            command.CatalogVersion,
            command.SelectedOptionCodes));

        if (shapeErrors.Count > 0)
        {
            return new(
                UseCaseStatus.InvalidRequest,
                null,
                shapeErrors);
        }

        UseCaseResult<string?> visualStateResult =
            VisualStateCanonicalizer.ValidateAndCanonicalize(command.VisualState);

        if (!visualStateResult.IsSuccess)
        {
            return new(
                visualStateResult.Status,
                null,
                visualStateResult.Errors);
        }

        return await store.CreateConfigurationAsync(
            command,
            visualStateResult.Data,
            product => ConfigurationEvaluator.Evaluate(
                product,
                command.SelectedOptionCodes),
            cancellationToken);
    }

    public Task<SavedConfigurationData?> GetConfigurationAsync(
        string configurationCode,
        CancellationToken cancellationToken) =>
        store.GetConfigurationAsync(
            configurationCode,
            cancellationToken);

    public Task<UseCaseResult<CreateQuoteRequestData>> CreateQuoteRequestAsync(
        CreateQuoteRequestCommand command,
        CancellationToken cancellationToken)
    {
        UseCaseResult<NormalizedQuoteIntent> normalization =
            NormalizeQuoteIntent(command);

        if (!normalization.IsSuccess)
        {
            return Task.FromResult(new UseCaseResult<CreateQuoteRequestData>(
                normalization.Status,
                null,
                normalization.Errors));
        }

        return store.CreateQuoteRequestAsync(
            normalization.Data!,
            cancellationToken);
    }

    private static UseCaseResult<NormalizedQuoteIntent> NormalizeQuoteIntent(
        CreateQuoteRequestCommand command)
    {
        var errors = new List<UseCaseError>();
        QuoteContact? contact = command.Contact;
        PrivacyAcknowledgment? privacyPolicy = command.PrivacyPolicy;

        if (command.ClientRequestId == Guid.Empty)
        {
            errors.Add(new(
                "INVALID_REQUEST",
                "El identificador de solicitud debe ser un GUID válido.",
                "clientRequestId"));
        }

        if (!IsPublicCode(command.ConfigurationCode, "NCF-"))
        {
            errors.Add(new(
                "INVALID_REQUEST",
                "El código de configuración no tiene un formato válido.",
                "configurationCode"));
        }

        if (contact is null)
        {
            errors.Add(new(
                "INVALID_REQUEST",
                "Los datos de contacto son obligatorios.",
                "contact"));
        }

        if (privacyPolicy is null)
        {
            errors.Add(new(
                "INVALID_REQUEST",
                "La confirmación de privacidad es obligatoria.",
                "privacyPolicy"));
        }

        if (errors.Count > 0)
        {
            return new(
                UseCaseStatus.InvalidRequest,
                null,
                errors);
        }

        string name = contact!.Name?.Trim() ?? string.Empty;
        string email = contact.Email?.Trim() ?? string.Empty;
        string? phone = NullIfWhiteSpace(contact.Phone);
        string? message = NullIfWhiteSpace(command.Message);
        string policyVersion =
            privacyPolicy!.Version?.Trim() ?? string.Empty;
        if (name.Length == 0)
        {
            errors.Add(new(
                "NAME_REQUIRED",
                "El nombre es obligatorio.",
                "contact.name"));
        }
        else if (name.EnumerateRunes().Count() > 150)
        {
            errors.Add(new(
                "NAME_REQUIRED",
                "El nombre supera el tamaño permitido.",
                "contact.name"));
        }

        if (email.Length == 0)
        {
            errors.Add(new(
                "EMAIL_REQUIRED",
                "El correo electrónico es obligatorio.",
                "contact.email"));
        }
        else if (email.EnumerateRunes().Count() > 254 ||
                 !MailAddress.TryCreate(email, out _))
        {
            errors.Add(new(
                "EMAIL_INVALID",
                "El correo electrónico no tiene un formato válido.",
                "contact.email"));
        }

        if (phone?.EnumerateRunes().Count() > 30)
        {
            errors.Add(new(
                "INVALID_REQUEST",
                "El teléfono supera el tamaño permitido.",
                "contact.phone"));
        }

        if (message?.EnumerateRunes().Count() > 1_000)
        {
            errors.Add(new(
                "INVALID_REQUEST",
                "El mensaje supera el tamaño permitido.",
                "message"));
        }

        if (!privacyPolicy.Acknowledged)
        {
            errors.Add(new(
                "PRIVACY_POLICY_NOT_ACKNOWLEDGED",
                "Debes confirmar que has leído la política de privacidad.",
                "privacyPolicy.acknowledged"));
        }

        if (policyVersion.Length == 0)
        {
            errors.Add(new(
                "PRIVACY_POLICY_VERSION_REQUIRED",
                "La versión de la política de privacidad es obligatoria.",
                "privacyPolicy.version"));
        }
        else if (policyVersion.EnumerateRunes().Count() > 100)
        {
            errors.Add(new(
                "PRIVACY_POLICY_VERSION_REQUIRED",
                "La versión de la política de privacidad supera el tamaño permitido.",
                "privacyPolicy.version"));
        }

        if (errors.Count > 0)
        {
            return new(
                UseCaseStatus.InvalidRequest,
                null,
                errors);
        }

        return UseCaseResults.Success(new NormalizedQuoteIntent(
            command.ClientRequestId,
            command.ConfigurationCode,
            name,
            email,
            phone,
            message,
            privacyPolicy.Acknowledged,
            policyVersion));
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        string? normalized = value?.Trim();
        return string.IsNullOrEmpty(normalized) ? null : normalized;
    }

    private static UseCaseError MapError(DomainError error) =>
        new(error.Code, error.Message, error.Target);

    private static UseCaseError[] ValidateConfigurationShape(
        string? companySlug,
        string? productCode,
        int catalogVersion,
        IReadOnlyList<string>? selectedOptionCodes)
    {
        var errors = new List<UseCaseError>();

        if (!IsCompanySlug(companySlug))
        {
            errors.Add(new(
                "INVALID_REQUEST",
                "El identificador de empresa no tiene un formato válido.",
                "companySlug"));
        }

        if (!IsCatalogCode(productCode))
        {
            errors.Add(new(
                "INVALID_REQUEST",
                "El código de producto no tiene un formato válido.",
                "productCode"));
        }

        if (catalogVersion <= 0)
        {
            errors.Add(new(
                "INVALID_REQUEST",
                "La versión de catálogo debe ser positiva.",
                "catalogVersion"));
        }

        if (selectedOptionCodes is null ||
            selectedOptionCodes.Count == 0)
        {
            errors.Add(new(
                "SELECTED_OPTIONS_REQUIRED",
                "Debes seleccionar al menos una opción.",
                "selectedOptionCodes"));
            return errors.ToArray();
        }

        if (selectedOptionCodes.Count > 500 ||
            selectedOptionCodes.Any(code => !IsCatalogCode(code)))
        {
            errors.Add(new(
                "INVALID_REQUEST",
                "La selección contiene un código de opción no válido.",
                "selectedOptionCodes"));
        }

        if (selectedOptionCodes
            .GroupBy(code => code, StringComparer.Ordinal)
            .Any(group => group.Count() > 1))
        {
            errors.Add(new(
                "DUPLICATE_OPTION_CODE",
                "Las opciones seleccionadas no pueden repetirse.",
                "selectedOptionCodes"));
        }

        return errors.ToArray();
    }

    private static bool IsCompanySlug(string? value) =>
        value is { Length: > 0 and <= 100 } &&
        value.All(character =>
            character is >= 'a' and <= 'z' or >= '0' and <= '9' or '-');

    private static bool IsCatalogCode(string? value) =>
        value is { Length: > 0 and <= 50 } &&
        value.All(character =>
            character is >= 'A' and <= 'Z' or >= '0' and <= '9' or '_' or '-');

    private static bool IsPublicCode(
        string? value,
        string prefix) =>
        value is { Length: 28 } &&
        value.StartsWith(prefix, StringComparison.Ordinal) &&
        value[prefix.Length..].All(character =>
            character is >= '0' and <= '9' or >= 'A' and <= 'F');
}
