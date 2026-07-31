namespace NainConfigurator.Domain;

public static class ConfigurationEvaluator
{
    public static ConfigurationEvaluation Evaluate(
        ProductDefinition product,
        IReadOnlyList<string> selectedOptionCodes)
    {
        ArgumentNullException.ThrowIfNull(product);
        ArgumentNullException.ThrowIfNull(selectedOptionCodes);

        var errors = new List<DomainError>();

        if (!product.IsActive || !product.IsPublished)
        {
            errors.Add(new(
                "PRODUCT_NOT_AVAILABLE",
                "El producto solicitado no está disponible.",
                "productCode"));

            return Invalid(errors);
        }

        if (product.CompatibilityRules.Any(
                rule => rule.IsActive &&
                    !string.Equals(
                        rule.Type,
                        CompatibilityRuleTypes.RequiresAny,
                        StringComparison.Ordinal)))
        {
            errors.Add(new(
                "PRODUCT_NOT_AVAILABLE",
                "El producto solicitado no está disponible.",
                "productCode"));

            return Invalid(errors);
        }

        if (selectedOptionCodes.Count == 0)
        {
            errors.Add(new(
                "SELECTED_OPTIONS_REQUIRED",
                "Debes seleccionar al menos una opción.",
                "selectedOptionCodes"));

            return Invalid(errors);
        }

        var duplicateCodes = selectedOptionCodes
            .GroupBy(code => code, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToArray();

        if (duplicateCodes.Length > 0)
        {
            errors.Add(new(
                "DUPLICATE_OPTION_CODE",
                "Las opciones seleccionadas no pueden repetirse.",
                "selectedOptionCodes"));

            return Invalid(errors);
        }

        var allOptions = product.OptionGroups
            .SelectMany(
                group => group.Options,
                (group, option) => new OptionWithGroup(group, option))
            .ToDictionary(
                item => item.Option.Code,
                item => item,
                StringComparer.Ordinal);

        var selectedOptions = new List<OptionWithGroup>();

        foreach (string selectedCode in selectedOptionCodes)
        {
            if (!allOptions.TryGetValue(selectedCode, out OptionWithGroup? selected))
            {
                errors.Add(new(
                    "OPTION_NOT_FOUND",
                    "Una de las opciones seleccionadas no existe.",
                    "selectedOptionCodes"));
                continue;
            }

            if (!selected.Group.IsActive || !selected.Option.IsActive)
            {
                errors.Add(new(
                    "OPTION_NOT_AVAILABLE",
                    "Una de las opciones seleccionadas no está disponible.",
                    "selectedOptionCodes"));
                continue;
            }

            selectedOptions.Add(selected);
        }

        if (errors.Count > 0)
        {
            return Invalid(errors);
        }

        var selectedCodes = selectedOptions
            .Select(item => item.Option.Code)
            .ToHashSet(StringComparer.Ordinal);

        foreach (OptionGroupDefinition group in product.OptionGroups
                     .Where(group => group.IsActive)
                     .OrderBy(group => group.SortOrder)
                     .ThenBy(group => group.Code, StringComparer.Ordinal))
        {
            int selectionCount = selectedOptions.Count(
                selected => string.Equals(
                    selected.Group.Code,
                    group.Code,
                    StringComparison.Ordinal));

            if (selectionCount < group.MinSelections)
            {
                errors.Add(new(
                    "MIN_SELECTIONS_NOT_REACHED",
                    $"Debes seleccionar al menos {group.MinSelections} opción u opciones en {group.Name}.",
                    "selectedOptionCodes"));
            }

            if (group.MaxSelections is short maximum &&
                selectionCount > maximum)
            {
                errors.Add(new(
                    "MAX_SELECTIONS_EXCEEDED",
                    $"Solo puedes seleccionar {maximum} opción u opciones en {group.Name}.",
                    "selectedOptionCodes"));
            }
        }

        foreach (CompatibilityRuleDefinition rule in product.CompatibilityRules
                     .Where(rule => rule.IsActive)
                     .OrderBy(rule => rule.Code, StringComparer.Ordinal))
        {
            bool isTriggered = rule.SourceOptionCodes.Any(selectedCodes.Contains);
            bool isSatisfied = rule.TargetOptionCodes.Any(selectedCodes.Contains);

            if (isTriggered && !isSatisfied)
            {
                errors.Add(new(
                    "INVALID_OPTION_COMBINATION",
                    rule.Message,
                    "selectedOptionCodes"));
            }
        }

        if (errors.Count > 0)
        {
            return Invalid(errors);
        }

        OptionWithGroup[] normalizedOptions = selectedOptions
            .OrderBy(item => item.Group.SortOrder)
            .ThenBy(item => item.Group.Code, StringComparer.Ordinal)
            .ThenBy(item => item.Option.SortOrder)
            .ThenBy(item => item.Option.Code, StringComparer.Ordinal)
            .ToArray();

        NormalizedSelection[] normalizedSelections = normalizedOptions
            .GroupBy(item => item.Group.Code, StringComparer.Ordinal)
            .Select(group => new NormalizedSelection(
                group.Key,
                group.Select(item => item.Option.Code).ToArray()))
            .ToArray();

        SelectedOptionSnapshot[] snapshots = normalizedOptions
            .Select(item => new SelectedOptionSnapshot(
                item.Group.Code,
                item.Group.Name,
                item.Option.Code,
                item.Option.Name,
                item.Option.PriceAdjustment,
                item.Option.VisualAssetKey))
            .ToArray();

        var priceBreakdown = new List<PriceComponent>
        {
            new("BasePrice", product.Code, product.Name, product.BasePrice),
        };

        priceBreakdown.AddRange(normalizedOptions.Select(item =>
            new PriceComponent(
                "OptionAdjustment",
                item.Option.Code,
                item.Option.Name,
                item.Option.PriceAdjustment)));

        decimal estimatedPrice = priceBreakdown.Sum(component => component.Amount);

        return new(
            true,
            normalizedSelections,
            snapshots,
            priceBreakdown,
            estimatedPrice,
            Array.Empty<DomainError>());
    }

    private static ConfigurationEvaluation Invalid(
        IReadOnlyList<DomainError> errors) =>
        new(
            false,
            Array.Empty<NormalizedSelection>(),
            Array.Empty<SelectedOptionSnapshot>(),
            Array.Empty<PriceComponent>(),
            null,
            errors);

    private sealed record OptionWithGroup(
        OptionGroupDefinition Group,
        ProductOptionDefinition Option);
}

public static class CompatibilityRuleTypes
{
    public const string RequiresAny = "RequiresAny";
}
