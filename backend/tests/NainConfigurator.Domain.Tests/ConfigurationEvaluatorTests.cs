using NainConfigurator.Domain;
using Xunit;

namespace NainConfigurator.Domain.Tests;

public sealed class ConfigurationEvaluatorTests
{
    [Fact]
    public void EvaluateReturnsDeterministicPriceAndOrder()
    {
        ProductDefinition product = CreateProduct();

        ConfigurationEvaluation first = ConfigurationEvaluator.Evaluate(
            product,
            ["ADDON_B", "SIZE_LARGE", "COLOR_BLUE", "ADDON_A"]);
        ConfigurationEvaluation second = ConfigurationEvaluator.Evaluate(
            product,
            ["COLOR_BLUE", "ADDON_A", "ADDON_B", "SIZE_LARGE"]);

        Assert.True(first.IsValid);
        Assert.Equal(165m, first.EstimatedPrice);
        Assert.Equal(
            first.NormalizedSelections.Select(item =>
                $"{item.OptionGroupCode}:{string.Join(',', item.OptionCodes)}"),
            second.NormalizedSelections.Select(item =>
                $"{item.OptionGroupCode}:{string.Join(',', item.OptionCodes)}"));
        Assert.Equal(first.PriceBreakdown, second.PriceBreakdown);
        Assert.Equal(
            ["SIZE_LARGE", "COLOR_BLUE", "ADDON_A", "ADDON_B"],
            first.SelectedOptions.Select(item => item.OptionCode));
    }

    [Fact]
    public void EvaluateRejectsMissingRequiredGroup()
    {
        ConfigurationEvaluation result = ConfigurationEvaluator.Evaluate(
            CreateProduct(),
            ["COLOR_BLUE"]);

        Assert.False(result.IsValid);
        Assert.Contains(
            result.Errors,
            item => item.Code == "MIN_SELECTIONS_NOT_REACHED");
        Assert.Null(result.EstimatedPrice);
    }

    [Fact]
    public void EvaluateRejectsMaximumExceeded()
    {
        ConfigurationEvaluation result = ConfigurationEvaluator.Evaluate(
            CreateProduct(),
            ["SIZE_SMALL", "COLOR_BLUE", "ADDON_A", "ADDON_B", "ADDON_C"]);

        Assert.False(result.IsValid);
        Assert.Contains(
            result.Errors,
            item => item.Code == "MAX_SELECTIONS_EXCEEDED");
    }

    [Fact]
    public void EvaluateRejectsDuplicateOptionCode()
    {
        ConfigurationEvaluation result = ConfigurationEvaluator.Evaluate(
            CreateProduct(),
            ["SIZE_SMALL", "SIZE_SMALL", "COLOR_BLUE"]);

        Assert.False(result.IsValid);
        Assert.Equal("DUPLICATE_OPTION_CODE", Assert.Single(result.Errors).Code);
    }

    [Fact]
    public void EvaluateRejectsUnknownOption()
    {
        ConfigurationEvaluation result = ConfigurationEvaluator.Evaluate(
            CreateProduct(),
            ["SIZE_SMALL", "COLOR_BLUE", "UNKNOWN"]);

        Assert.False(result.IsValid);
        Assert.Contains(
            result.Errors,
            item => item.Code == "OPTION_NOT_FOUND");
    }

    [Fact]
    public void EvaluateRejectsInactiveOption()
    {
        ConfigurationEvaluation result = ConfigurationEvaluator.Evaluate(
            CreateProduct(),
            ["SIZE_SMALL", "COLOR_BLUE", "ADDON_INACTIVE"]);

        Assert.False(result.IsValid);
        Assert.Contains(
            result.Errors,
            item => item.Code == "OPTION_NOT_AVAILABLE");
    }

    [Fact]
    public void EvaluateEnforcesRequiresAnyRule()
    {
        ConfigurationEvaluation result = ConfigurationEvaluator.Evaluate(
            CreateProduct(),
            ["SIZE_LARGE", "COLOR_RED"]);

        Assert.False(result.IsValid);
        Assert.Contains(
            result.Errors,
            item => item.Code == "INVALID_OPTION_COMBINATION");
    }

    [Fact]
    public void EvaluateFailsSafeForUnsupportedPublishedRule()
    {
        ProductDefinition product = CreateProduct() with
        {
            CompatibilityRules =
            [
                new(
                    "UNSUPPORTED",
                    "ProductSpecificRule",
                    ["SIZE_LARGE"],
                    ["COLOR_BLUE"],
                    "Unsupported",
                    true),
            ],
        };

        ConfigurationEvaluation result = ConfigurationEvaluator.Evaluate(
            product,
            ["SIZE_LARGE", "COLOR_BLUE"]);

        Assert.False(result.IsValid);
        Assert.Equal("PRODUCT_NOT_AVAILABLE", Assert.Single(result.Errors).Code);
    }

    [Fact]
    public void EvaluateUsesSameModelForFundamentallyDifferentProduct()
    {
        ProductDefinition bicycle = CreateProduct() with
        {
            Code = "BICYCLE-001",
            Name = "Bicycle",
            BasePrice = 700m,
            OptionGroups =
            [
                new(
                    "DRIVE",
                    "Drive",
                    1,
                    1,
                    true,
                    1,
                    [
                        new(
                            "DRIVE_CHAIN",
                            "Chain",
                            0m,
                            null,
                            true,
                            true,
                            1),
                        new(
                            "DRIVE_ELECTRIC",
                            "Electric",
                            600m,
                            null,
                            false,
                            true,
                            2),
                    ]),
                new(
                    "BRAKE",
                    "Brake",
                    1,
                    1,
                    true,
                    2,
                    [
                        new(
                            "BRAKE_DISC",
                            "Disc",
                            50m,
                            null,
                            true,
                            true,
                            1),
                        new(
                            "BRAKE_HYDRAULIC",
                            "Hydraulic",
                            150m,
                            null,
                            false,
                            true,
                            2),
                    ]),
            ],
            CompatibilityRules =
            [
                new(
                    "ELECTRIC_REQUIRES_HYDRAULIC",
                    CompatibilityRuleTypes.RequiresAny,
                    ["DRIVE_ELECTRIC"],
                    ["BRAKE_HYDRAULIC"],
                    "Electric drive requires hydraulic brakes.",
                    true),
            ],
        };

        ConfigurationEvaluation result = ConfigurationEvaluator.Evaluate(
            bicycle,
            ["DRIVE_ELECTRIC", "BRAKE_HYDRAULIC"]);

        Assert.True(result.IsValid);
        Assert.Equal(1450m, result.EstimatedPrice);
    }

    private static ProductDefinition CreateProduct() =>
        new(
            1,
            1,
            new(
                "test-company",
                "Test company",
                "en-GB",
                null,
                new(
                    1,
                    "1",
                    "https://demo.invalid/privacy",
                    new string('0', 64),
                    new DateTime(
                        2026,
                        7,
                        30,
                        0,
                        0,
                        0,
                        DateTimeKind.Utc),
                    365)),
            "PRODUCT-001",
            "Product",
            "Generic product",
            1,
            100m,
            "EUR",
            "Estimate",
            null,
            true,
            true,
            [
                new(
                    "SIZE",
                    "Size",
                    1,
                    1,
                    true,
                    1,
                    [
                        new(
                            "SIZE_SMALL",
                            "Small",
                            0m,
                            null,
                            true,
                            true,
                            1),
                        new(
                            "SIZE_LARGE",
                            "Large",
                            40m,
                            null,
                            false,
                            true,
                            2),
                    ]),
                new(
                    "COLOR",
                    "Colour",
                    1,
                    1,
                    true,
                    2,
                    [
                        new(
                            "COLOR_BLUE",
                            "Blue",
                            5m,
                            null,
                            true,
                            true,
                            1),
                        new(
                            "COLOR_RED",
                            "Red",
                            10m,
                            null,
                            false,
                            true,
                            2),
                    ]),
                new(
                    "ADDONS",
                    "Add-ons",
                    0,
                    2,
                    true,
                    3,
                    [
                        new(
                            "ADDON_A",
                            "A",
                            10m,
                            null,
                            false,
                            true,
                            1),
                        new(
                            "ADDON_B",
                            "B",
                            10m,
                            null,
                            false,
                            true,
                            2),
                        new(
                            "ADDON_C",
                            "C",
                            10m,
                            null,
                            false,
                            true,
                            3),
                        new(
                            "ADDON_INACTIVE",
                            "Inactive",
                            0m,
                            null,
                            false,
                            false,
                            4),
                    ]),
            ],
            [
                new(
                    "RED_REQUIRES_SMALL",
                    CompatibilityRuleTypes.RequiresAny,
                    ["COLOR_RED"],
                    ["SIZE_SMALL"],
                    "Red requires the small size.",
                    true),
            ]);
}
