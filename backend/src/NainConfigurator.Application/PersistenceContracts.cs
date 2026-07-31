using NainConfigurator.Domain;

namespace NainConfigurator.Application;

public interface INainConfiguratorStore
{
    Task<ProductDefinition?> GetPublishedProductAsync(
        string companySlug,
        string productCode,
        CancellationToken cancellationToken);

    Task<ProductDefinition?> GetProductForValidationAsync(
        string companySlug,
        string productCode,
        CancellationToken cancellationToken);

    Task<UseCaseResult<CreateConfigurationData>> CreateConfigurationAsync(
        CreateConfigurationCommand command,
        string? canonicalVisualStateJson,
        Func<ProductDefinition, ConfigurationEvaluation> evaluate,
        CancellationToken cancellationToken);

    Task<SavedConfigurationData?> GetConfigurationAsync(
        string configurationCode,
        CancellationToken cancellationToken);

    Task<UseCaseResult<CreateQuoteRequestData>> CreateQuoteRequestAsync(
        NormalizedQuoteIntent intent,
        CancellationToken cancellationToken);
}

public interface IClock
{
    DateTime UtcNow { get; }
}

public interface IPublicCodeGenerator
{
    string CreateConfigurationCode();

    string CreateQuoteRequestCode();
}
