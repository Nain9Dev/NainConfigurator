import { describe, expect, it } from "vitest";

import {
  calculateDraftPrice,
  defaultSelections,
  updateSelection,
} from "./catalog";
import type { ProductCatalog } from "./types";

const catalog: ProductCatalog = {
  company: {
    slug: "test-company",
    name: "Test company",
    locale: "en-GB",
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
    description: "Generic test product",
    catalogVersion: 1,
    basePrice: 100,
    currencyCode: "EUR",
    priceDisclaimer: "Estimate",
    visualAssetKey: null,
    optionGroups: [
      {
        code: "SIZE",
        name: "Size",
        minSelections: 1,
        maxSelections: 1,
        sortOrder: 1,
        options: [
          {
            code: "SIZE_A",
            name: "A",
            priceAdjustment: 0,
            visualAssetKey: null,
            isDefault: true,
            sortOrder: 1,
          },
          {
            code: "SIZE_B",
            name: "B",
            priceAdjustment: 25,
            visualAssetKey: null,
            isDefault: false,
            sortOrder: 2,
          },
        ],
      },
    ],
    compatibilityRules: [],
  },
};

describe("catalog-driven selection", () => {
  it("derives defaults and draft price from catalog data", () => {
    expect(defaultSelections(catalog)).toEqual(["SIZE_A"]);
    expect(calculateDraftPrice(catalog, ["SIZE_B"])).toBe(125);
  });

  it("replaces a single-select group without product-specific logic", () => {
    expect(
      updateSelection(
        ["SIZE_A", "UNRELATED"],
        ["SIZE_A", "SIZE_B"],
        "SIZE_B",
        true,
        true,
      ).sort(),
    ).toEqual(["SIZE_B", "UNRELATED"]);
  });
});
