import { describe, expect, it } from "vitest";

import {
  calculateDraftPrice,
  defaultSelections,
  pendingRuleWarnings,
  ruleRoleFor,
  selectedVisualKeys,
  unsatisfiedRules,
  updateSelection,
} from "./catalog";
import type { CompatibilityRule, ProductCatalog } from "./types";

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

const RULE: CompatibilityRule = {
  code: "B_REQUIRES_EXTRA",
  type: "RequiresAny",
  sourceOptionCodes: ["SIZE_B"],
  targetOptionCodes: ["EXTRA_X"],
  message: "B requires X.",
};

function withRule(): ProductCatalog {
  const next = structuredClone(catalog);
  next.product.compatibilityRules = [RULE];
  next.product.optionGroups.push({
    code: "EXTRA",
    name: "Extra",
    minSelections: 0,
    maxSelections: 1,
    sortOrder: 2,
    options: [
      {
        code: "EXTRA_X",
        name: "X",
        priceAdjustment: 10,
        visualAssetKey: "Extra_X",
        isDefault: false,
        sortOrder: 1,
      },
    ],
  });

  return next;
}

describe("compatibility rule preview", () => {
  it("reports nothing while the rule is not triggered", () => {
    expect(unsatisfiedRules(withRule(), ["SIZE_A"])).toEqual([]);
  });

  it("reports a triggered rule that nothing satisfies", () => {
    expect(unsatisfiedRules(withRule(), ["SIZE_B"])).toEqual([RULE]);
    expect(pendingRuleWarnings(withRule(), ["SIZE_B"])).toEqual([
      "B requires X.",
    ]);
  });

  it("clears once a target option is selected", () => {
    expect(unsatisfiedRules(withRule(), ["SIZE_B", "EXTRA_X"])).toEqual([]);
  });

  it("reports a rule even while a required group is still empty", () => {
    // The mirrored server evaluator stops at the first class of error; a
    // preview must not, or the user never sees what is actually in their way.
    expect(unsatisfiedRules(withRule(), ["SIZE_B"])).toHaveLength(1);
  });

  it("marks the selected option that triggers a rule as the conflict", () => {
    expect(ruleRoleFor([RULE], "SIZE_B", true)).toBe("conflict");
  });

  it("does not mark an unselected source option", () => {
    expect(ruleRoleFor([RULE], "SIZE_B", false)).toBeNull();
  });

  it("marks an option that would satisfy the rule", () => {
    expect(ruleRoleFor([RULE], "EXTRA_X", false)).toBe("resolves");
  });

  it("marks nothing when no rule is broken", () => {
    expect(ruleRoleFor([], "SIZE_B", true)).toBeNull();
  });
});

describe("selectedVisualKeys", () => {
  it("returns the keys of the selected options only", () => {
    expect(selectedVisualKeys(withRule(), ["SIZE_B", "EXTRA_X"])).toEqual([
      "Extra_X",
    ]);
  });

  it("skips options with no visual asset key", () => {
    expect(selectedVisualKeys(withRule(), ["SIZE_A"])).toEqual([]);
  });
});
