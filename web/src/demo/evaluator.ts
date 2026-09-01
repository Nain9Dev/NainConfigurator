/**
 * Browser reimplementation of the server-side configuration evaluator.
 *
 * IMPORTANT — this is deliberate, bounded duplication of business logic.
 *
 * The authoritative implementation is `ConfigurationEvaluator` in
 * `backend/src/NainConfigurator.Domain`. It is the only implementation that may
 * decide whether a configuration can be persisted or priced. This module exists
 * so the public demo can run with no backend and no database, and every result
 * it produces is surfaced to the user as a non-authoritative estimate.
 *
 * The rules below mirror the C# evaluator step for step, including error codes,
 * message text and normalisation order, so that a divergence shows up as a
 * failing test rather than as a silently different answer. `evaluator.test.ts`
 * mirrors `ConfigurationEvaluatorTests.cs` for the same reason.
 *
 * Money is computed in minor units. The server uses `decimal`; JavaScript
 * doubles would drift on a sum such as 379.90 + 80.00 + 45.50.
 */

import type {
  CatalogOption,
  CatalogOptionGroup,
  PriceComponent,
  ProductCatalog,
} from "../types";

export interface EvaluationError {
  code: string;
  message: string;
  target: string | null;
}

export interface NormalizedSelection {
  optionGroupCode: string;
  optionCodes: string[];
}

export interface SelectedOptionSnapshot {
  optionGroupCode: string;
  optionGroupName: string;
  optionCode: string;
  optionName: string;
  priceAdjustment: number;
  visualAssetKey: string | null;
}

export interface Evaluation {
  isValid: boolean;
  normalizedSelections: NormalizedSelection[];
  selectedOptions: SelectedOptionSnapshot[];
  priceBreakdown: PriceComponent[];
  estimatedPrice: number | null;
  errors: EvaluationError[];
}

const COMPATIBILITY_RULE_REQUIRES_ANY = "RequiresAny";

interface OptionWithGroup {
  group: CatalogOptionGroup;
  option: CatalogOption;
}

export function evaluate(
  catalog: ProductCatalog,
  selectedOptionCodes: readonly string[],
): Evaluation {
  const { product } = catalog;
  const errors: EvaluationError[] = [];

  if (
    product.compatibilityRules.some(
      (rule) => rule.type !== COMPATIBILITY_RULE_REQUIRES_ANY,
    )
  ) {
    return invalid([
      {
        code: "PRODUCT_NOT_AVAILABLE",
        message: "El producto solicitado no está disponible.",
        target: "productCode",
      },
    ]);
  }

  if (selectedOptionCodes.length === 0) {
    return invalid([
      {
        code: "SELECTED_OPTIONS_REQUIRED",
        message: "Debes seleccionar al menos una opción.",
        target: "selectedOptionCodes",
      },
    ]);
  }

  if (new Set(selectedOptionCodes).size !== selectedOptionCodes.length) {
    return invalid([
      {
        code: "DUPLICATE_OPTION_CODE",
        message: "Las opciones seleccionadas no pueden repetirse.",
        target: "selectedOptionCodes",
      },
    ]);
  }

  const allOptions = new Map<string, OptionWithGroup>();

  for (const group of product.optionGroups) {
    for (const option of group.options) {
      allOptions.set(option.code, { group, option });
    }
  }

  const selectedOptions: OptionWithGroup[] = [];

  for (const code of selectedOptionCodes) {
    const found = allOptions.get(code);

    if (found === undefined) {
      errors.push({
        code: "OPTION_NOT_FOUND",
        message: "Una de las opciones seleccionadas no existe.",
        target: "selectedOptionCodes",
      });
      continue;
    }

    selectedOptions.push(found);
  }

  if (errors.length > 0) {
    return invalid(errors);
  }

  const selectedCodes = new Set(
    selectedOptions.map((item) => item.option.code),
  );

  for (const group of [...product.optionGroups].sort(byGroupOrder)) {
    const selectionCount = selectedOptions.filter(
      (item) => item.group.code === group.code,
    ).length;

    if (selectionCount < group.minSelections) {
      errors.push({
        code: "MIN_SELECTIONS_NOT_REACHED",
        message: `Debes seleccionar al menos ${group.minSelections} opción u opciones en ${group.name}.`,
        target: "selectedOptionCodes",
      });
    }

    if (group.maxSelections !== null && selectionCount > group.maxSelections) {
      errors.push({
        code: "MAX_SELECTIONS_EXCEEDED",
        message: `Solo puedes seleccionar ${group.maxSelections} opción u opciones en ${group.name}.`,
        target: "selectedOptionCodes",
      });
    }
  }

  for (const rule of [...product.compatibilityRules].sort(byCode)) {
    const isTriggered = rule.sourceOptionCodes.some((code) =>
      selectedCodes.has(code),
    );
    const isSatisfied = rule.targetOptionCodes.some((code) =>
      selectedCodes.has(code),
    );

    if (isTriggered && !isSatisfied) {
      errors.push({
        code: "INVALID_OPTION_COMBINATION",
        message: rule.message,
        target: "selectedOptionCodes",
      });
    }
  }

  if (errors.length > 0) {
    return invalid(errors);
  }

  const normalizedOptions = [...selectedOptions].sort(
    (left, right) =>
      byGroupOrder(left.group, right.group) ||
      left.option.sortOrder - right.option.sortOrder ||
      compare(left.option.code, right.option.code),
  );

  const normalizedSelections: NormalizedSelection[] = [];

  for (const item of normalizedOptions) {
    const last = normalizedSelections.at(-1);

    if (last !== undefined && last.optionGroupCode === item.group.code) {
      last.optionCodes.push(item.option.code);
    } else {
      normalizedSelections.push({
        optionGroupCode: item.group.code,
        optionCodes: [item.option.code],
      });
    }
  }

  const priceBreakdown: PriceComponent[] = [
    {
      type: "BasePrice",
      code: product.code,
      name: product.name,
      amount: product.basePrice,
    },
    ...normalizedOptions.map((item) => ({
      type: "OptionAdjustment" as const,
      code: item.option.code,
      name: item.option.name,
      amount: item.option.priceAdjustment,
    })),
  ];

  return {
    isValid: true,
    normalizedSelections,
    selectedOptions: normalizedOptions.map((item) => ({
      optionGroupCode: item.group.code,
      optionGroupName: item.group.name,
      optionCode: item.option.code,
      optionName: item.option.name,
      priceAdjustment: item.option.priceAdjustment,
      visualAssetKey: item.option.visualAssetKey,
    })),
    priceBreakdown,
    estimatedPrice: sumMoney(priceBreakdown.map((item) => item.amount)),
    errors: [],
  };
}

/** Adds monetary amounts in minor units so repeated sums do not drift. */
export function sumMoney(amounts: readonly number[]): number {
  const total = amounts.reduce(
    (accumulator, amount) => accumulator + Math.round(amount * 100),
    0,
  );

  return total / 100;
}

function invalid(errors: EvaluationError[]): Evaluation {
  return {
    isValid: false,
    normalizedSelections: [],
    selectedOptions: [],
    priceBreakdown: [],
    estimatedPrice: null,
    errors,
  };
}

function byGroupOrder(
  left: CatalogOptionGroup,
  right: CatalogOptionGroup,
): number {
  return left.sortOrder - right.sortOrder || compare(left.code, right.code);
}

function byCode(left: { code: string }, right: { code: string }): number {
  return compare(left.code, right.code);
}

/** Ordinal comparison, matching StringComparer.Ordinal on the server. */
function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
