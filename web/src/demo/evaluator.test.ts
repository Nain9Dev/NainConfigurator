import { describe, expect, it } from "vitest";

import { evaluate, sumMoney } from "./evaluator";
import type { ProductCatalog } from "../types";

/**
 * Mirrors `ConfigurationEvaluatorTests.cs`.
 *
 * The browser evaluator only earns its place if it answers exactly what the
 * server would. These cases assert the same error codes, the same ordering and
 * the same arithmetic, so a divergence fails here instead of quietly showing a
 * visitor a price the API would refuse.
 */

function catalog(overrides: Partial<ProductCatalog["product"]> = {}) {
  const base: ProductCatalog = {
    company: {
      slug: "test-company",
      name: "Test company",
      locale: "es-ES",
      branding: null,
      privacyPolicy: {
        activeVersion: "1",
        resourceUrl: "https://demo.invalid/privacy",
        contentHashSha256: "0".repeat(64),
        publishedAtUtc: "2026-07-30T00:00:00Z",
        quoteRetentionDays: 365,
      },
    },
    product: {
      code: "PRODUCT-001",
      name: "Test product",
      description: "Generic",
      catalogVersion: 1,
      basePrice: 379.9,
      currencyCode: "EUR",
      priceDisclaimer: "Estimate",
      visualAssetKey: null,
      optionGroups: [
        {
          code: "SIZE",
          name: "Tamaño",
          minSelections: 1,
          maxSelections: 1,
          sortOrder: 10,
          options: [
            {
              code: "SIZE_SMALL",
              name: "Pequeño",
              priceAdjustment: 0,
              visualAssetKey: "Visual_Small",
              isDefault: true,
              sortOrder: 10,
            },
            {
              code: "SIZE_LARGE",
              name: "Grande",
              priceAdjustment: 80,
              visualAssetKey: "Visual_Large",
              isDefault: false,
              sortOrder: 20,
            },
          ],
        },
        {
          code: "EXTRAS",
          name: "Extras",
          minSelections: 0,
          maxSelections: 2,
          sortOrder: 20,
          options: [
            {
              code: "EXTRA_A",
              name: "Extra A",
              priceAdjustment: 45.5,
              visualAssetKey: null,
              isDefault: false,
              sortOrder: 10,
            },
            {
              code: "EXTRA_B",
              name: "Extra B",
              priceAdjustment: 12.25,
              visualAssetKey: null,
              isDefault: false,
              sortOrder: 20,
            },
            {
              code: "EXTRA_C",
              name: "Extra C",
              priceAdjustment: 5,
              visualAssetKey: null,
              isDefault: false,
              sortOrder: 30,
            },
          ],
        },
      ],
      compatibilityRules: [
        {
          code: "LARGE_REQUIRES_EXTRA_A",
          type: "RequiresAny",
          sourceOptionCodes: ["SIZE_LARGE"],
          targetOptionCodes: ["EXTRA_A"],
          message: "Grande requiere Extra A.",
        },
      ],
      ...overrides,
    },
  };

  return base;
}

const codes = (evaluationErrors: { code: string }[]) =>
  evaluationErrors.map((error) => error.code);

describe("configuration evaluator", () => {
  it("accepts a valid selection and prices it from the catalog", () => {
    const result = evaluate(catalog(), ["SIZE_SMALL", "EXTRA_B"]);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.estimatedPrice).toBe(392.15);
  });

  it("adds money without floating-point drift", () => {
    const result = evaluate(catalog(), [
      "SIZE_LARGE",
      "EXTRA_A",
      "EXTRA_B",
    ]);

    // 379.90 + 80.00 + 45.50 + 12.25, which a naive float sum gets wrong.
    expect(result.estimatedPrice).toBe(517.65);
    expect(sumMoney([379.9, 80, 45.5, 12.25])).toBe(517.65);
  });

  it("rejects an empty selection", () => {
    const result = evaluate(catalog(), []);

    expect(result.isValid).toBe(false);
    expect(codes(result.errors)).toEqual(["SELECTED_OPTIONS_REQUIRED"]);
  });

  it("rejects a repeated option code", () => {
    const result = evaluate(catalog(), ["SIZE_SMALL", "SIZE_SMALL"]);

    expect(codes(result.errors)).toEqual(["DUPLICATE_OPTION_CODE"]);
  });

  it("rejects an option the catalog does not contain", () => {
    const result = evaluate(catalog(), ["SIZE_SMALL", "NOT_IN_CATALOG"]);

    expect(codes(result.errors)).toEqual(["OPTION_NOT_FOUND"]);
  });

  it("requires the minimum number of selections in a group", () => {
    const result = evaluate(catalog(), ["EXTRA_A"]);

    expect(codes(result.errors)).toContain("MIN_SELECTIONS_NOT_REACHED");
    expect(result.errors[0]?.message).toContain("Tamaño");
  });

  it("rejects more selections than a group allows", () => {
    const result = evaluate(catalog(), [
      "SIZE_SMALL",
      "EXTRA_A",
      "EXTRA_B",
      "EXTRA_C",
    ]);

    expect(codes(result.errors)).toEqual(["MAX_SELECTIONS_EXCEEDED"]);
  });

  it("applies a RequiresAny rule only when it is triggered", () => {
    expect(evaluate(catalog(), ["SIZE_SMALL"]).isValid).toBe(true);

    const broken = evaluate(catalog(), ["SIZE_LARGE"]);

    expect(codes(broken.errors)).toEqual(["INVALID_OPTION_COMBINATION"]);
    expect(broken.errors[0]?.message).toBe("Grande requiere Extra A.");

    expect(evaluate(catalog(), ["SIZE_LARGE", "EXTRA_A"]).isValid).toBe(true);
  });

  it("refuses a product carrying an unsupported rule type", () => {
    const unsupported = catalog({
      compatibilityRules: [
        {
          code: "FUTURE_RULE",
          // A rule type this release does not implement must fail closed.
          type: "RequiresAny" as unknown as "RequiresAny",
          sourceOptionCodes: ["SIZE_LARGE"],
          targetOptionCodes: ["EXTRA_A"],
          message: "n/a",
        },
      ],
    });
    unsupported.product.compatibilityRules[0]!.type =
      "ExcludesAll" as unknown as "RequiresAny";

    const result = evaluate(unsupported, ["SIZE_SMALL"]);

    expect(codes(result.errors)).toEqual(["PRODUCT_NOT_AVAILABLE"]);
  });

  it("normalises selections in catalog order regardless of input order", () => {
    const result = evaluate(catalog(), ["EXTRA_B", "EXTRA_A", "SIZE_LARGE"]);

    expect(result.isValid).toBe(true);
    expect(result.normalizedSelections).toEqual([
      { optionGroupCode: "SIZE", optionCodes: ["SIZE_LARGE"] },
      { optionGroupCode: "EXTRAS", optionCodes: ["EXTRA_A", "EXTRA_B"] },
    ]);
  });

  it("returns a breakdown that starts with the base price", () => {
    const result = evaluate(catalog(), ["SIZE_LARGE", "EXTRA_A"]);

    expect(result.priceBreakdown[0]).toEqual({
      type: "BasePrice",
      code: "PRODUCT-001",
      name: "Test product",
      amount: 379.9,
    });
    expect(result.priceBreakdown.slice(1).map((item) => item.type)).toEqual([
      "OptionAdjustment",
      "OptionAdjustment",
    ]);
  });

  it("carries visual asset keys into the snapshot without pricing them", () => {
    const result = evaluate(catalog(), ["SIZE_LARGE", "EXTRA_A"]);

    expect(result.selectedOptions.map((item) => item.visualAssetKey)).toEqual([
      "Visual_Large",
      null,
    ]);
  });
});
