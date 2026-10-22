/**
 * Pure helpers over a product catalog.
 *
 * Nothing here knows what a desk or a bicycle is. Every function reads option
 * groups, options and compatibility rules, which is what makes one shell able
 * to render unrelated products without a branch.
 */

import { sumMoney } from "./demo/evaluator";
import type {
  CatalogOption,
  CatalogOptionGroup,
  CompatibilityRule,
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
 * Compatibility rules the current selection breaks.
 *
 * This is the preview the browser shows while the user is still choosing, and
 * it is advisory: the authoritative verdict is `ConfigurationEvaluator` on the
 * server, mirrored for offline mode by `demo/evaluator`. It reports rules even
 * while a group is still missing a required choice, which the mirrored
 * evaluator deliberately does not — a verdict stops at the first class of
 * error, a preview should show the user everything that is in their way.
 */
export function unsatisfiedRules(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
): CompatibilityRule[] {
  const selected = new Set(selectedOptionCodes);

  return catalog.product.compatibilityRules.filter(
    (rule) =>
      rule.type === "RequiresAny" &&
      rule.sourceOptionCodes.some((code) => selected.has(code)) &&
      !rule.targetOptionCodes.some((code) => selected.has(code)),
  );
}

/** The messages of {@link unsatisfiedRules}, in catalog order. */
export function pendingRuleWarnings(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
): string[] {
  return unsatisfiedRules(catalog, selectedOptionCodes).map(
    (rule) => rule.message,
  );
}

/**
 * How a given option relates to the rules the selection currently breaks:
 * `"conflict"` for a selected option that triggers one, `"resolves"` for an
 * option that would satisfy one, `null` for everything else.
 */
export function ruleRoleFor(
  rules: readonly CompatibilityRule[],
  optionCode: string,
  isSelected: boolean,
): "conflict" | "resolves" | null {
  if (
    isSelected &&
    rules.some((rule) => rule.sourceOptionCodes.includes(optionCode))
  ) {
    return "conflict";
  }

  return rules.some((rule) => rule.targetOptionCodes.includes(optionCode))
    ? "resolves"
    : null;
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

/** Spanish count plus noun, agreeing in number. */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
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
