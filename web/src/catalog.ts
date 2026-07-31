import type { CatalogOption, ProductCatalog } from "./types";

export function defaultSelections(catalog: ProductCatalog): string[] {
  return catalog.product.optionGroups.flatMap((group) =>
    group.options
      .filter((option) => option.isDefault)
      .map((option) => option.code),
  );
}

export function calculateDraftPrice(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
): number {
  const selected = new Set(selectedOptionCodes);
  return catalog.product.optionGroups
    .flatMap((group) => group.options)
    .filter((option) => selected.has(option.code))
    .reduce(
      (total, option) => total + option.priceAdjustment,
      catalog.product.basePrice,
    );
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
