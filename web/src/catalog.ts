/**
 * Pure helpers over a product catalog.
 *
 * Nothing here knows what a desk or a bicycle is. Every function reads option
 * groups, options and compatibility rules, which is what makes one shell able
 * to render unrelated products without a branch.
 */

import { evaluate, sumMoney } from "./demo/evaluator";
import type {
  CatalogOption,
  CatalogOptionGroup,
  ProductCatalog,
} from "./types";

export { sumMoney };

export function defaultSelections(catalog: ProductCatalog): string[] {
  return catalog.product.optionGroups.flatMap((group) =>
    group.options
      .filter((option) => option.isDefault)
      .map((option) => option.code),
  );
}

/**
 * The browser's own estimate, shown while the user is still choosing.
 *
 * It is never a commitment. The server recomputes the price from the catalog
 * before anything is persisted, and its answer wins.
 */
export function calculateDraftPrice(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
): number {
  const selected = new Set(selectedOptionCodes);

  return sumMoney([
    catalog.product.basePrice,
    ...catalog.product.optionGroups
      .flatMap((group) => group.options)
      .filter((option) => selected.has(option.code))
      .map((option) => option.priceAdjustment),
  ]);
}

export function updateSelection(
  current: string[],
  groupOptionCodes: string[],
  optionCode: string | null,
  singleSelection: boolean,
  checked: boolean,
): string[] {
  const next = new Set(current);

  if (singleSelection) {
    for (const code of groupOptionCodes) {
      next.delete(code);
    }

    if (optionCode !== null) {
      next.add(optionCode);
    }
  } else if (optionCode !== null) {
    if (checked) {
      next.add(optionCode);
    } else {
      next.delete(optionCode);
    }
  }

  return [...next];
}

export function selectedVisualKeys(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
): string[] {
  const selected = new Set(selectedOptionCodes);

  return catalog.product.optionGroups
    .flatMap((group) => group.options)
    .filter(
      (option): option is CatalogOption & { visualAssetKey: string } =>
        selected.has(option.code) && option.visualAssetKey !== null,
    )
    .map((option) => option.visualAssetKey);
}

/**
 * Rules the current selection would break, evaluated locally for immediate
 * feedback. Advisory only: the server still decides, and the UI labels these
 * as a preview rather than as a verdict.
 */
export function pendingRuleWarnings(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
): string[] {
  if (selectedOptionCodes.length === 0) {
    return [];
  }

  const evaluation = evaluate(catalog, selectedOptionCodes);

  return evaluation.errors
    .filter((error) => error.code === "INVALID_OPTION_COMBINATION")
    .map((error) => error.message);
}

/** Groups still missing a required choice, in catalog order. */
export function unsatisfiedGroups(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
): CatalogOptionGroup[] {
  const selected = new Set(selectedOptionCodes);

  return catalog.product.optionGroups.filter(
    (group) =>
      group.options.filter((option) => selected.has(option.code)).length <
      group.minSelections,
  );
}

export function countSelectedInGroup(
  group: CatalogOptionGroup,
  selectedOptionCodes: string[],
): number {
  const selected = new Set(selectedOptionCodes);

  return group.options.filter((option) => selected.has(option.code)).length;
}

/**
 * Human-readable constraint for a group, derived from its limits alone.
 * "Obligatorio" and "Opcional" stay first so the label reads the same way it
 * always has for assistive technology.
 */
export function describeGroupConstraint(group: CatalogOptionGroup): string {
  const requirement = group.minSelections > 0 ? "Obligatorio" : "Opcional";

  if (group.maxSelections === 1) {
    return `${requirement} · elige 1`;
  }

  if (group.maxSelections === null) {
    return `${requirement} · sin límite`;
  }

  return `${requirement} · hasta ${group.maxSelections}`;
}

export function formatMoney(
  amount: number,
  locale: string,
  currencyCode: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

/** Signed amount for a price-breakdown row, so adjustments read as deltas. */
export function formatSignedMoney(
  amount: number,
  locale: string,
  currencyCode: string,
): string {
  const formatted = formatMoney(Math.abs(amount), locale, currencyCode);

  if (amount === 0) {
    return formatted;
  }

  return `${amount > 0 ? "+" : "−"} ${formatted}`;
}

export function formatDate(value: string, locale: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}
