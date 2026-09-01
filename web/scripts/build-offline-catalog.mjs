// Projects the SQL seed catalog into the shape the public API returns, so the
// offline demo mode serves exactly the data a running backend would serve.
//
// The seed file in database/demo is the single source of truth. This script
// only reshapes it: it drops the fields the public contract never exposes
// (internal identifiers, inactive rows, raw privacy content) and derives the
// privacy content hash the API computes at read time.
//
// Output: web/public/offline-catalog.json (generated, not committed).

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(here, "../../database/demo/technical-demo-catalogs.json");
const outputPath = resolve(here, "../public/offline-catalog.json");

const seed = JSON.parse(await readFile(seedPath, "utf8"));

const byCode = (left, right) => (left.code < right.code ? -1 : left.code > right.code ? 1 : 0);
const bySortOrderThenCode = (left, right) =>
  left.sortOrder - right.sortOrder || byCode(left, right);

/** Mirrors ApiContractMapper: active rows only, deterministic order. */
function mapProduct(company, product) {
  return {
    company: {
      slug: company.slug,
      name: company.displayName,
      locale: company.defaultLocale,
      branding: company.branding ?? null,
      privacyPolicy: {
        activeVersion: company.privacyPolicy.version,
        resourceUrl: company.privacyPolicy.resourceUrl,
        contentHashSha256: createHash("sha256")
          .update(company.privacyPolicy.content, "utf8")
          .digest("hex"),
        publishedAtUtc: company.privacyPolicy.publishedAtUtc,
        quoteRetentionDays: company.privacyPolicy.quoteRetentionDays,
      },
    },
    product: {
      code: product.code,
      name: product.name,
      description: product.description,
      catalogVersion: product.catalogVersion,
      basePrice: product.basePrice,
      currencyCode: product.currencyCode,
      priceDisclaimer: product.priceDisclaimer,
      visualAssetKey: product.visualAssetKey ?? null,
      optionGroups: product.optionGroups
        .filter((group) => group.isActive)
        .sort(bySortOrderThenCode)
        .map((group) => ({
          code: group.code,
          name: group.name,
          minSelections: group.minSelections,
          maxSelections: group.maxSelections,
          sortOrder: group.sortOrder,
          options: group.options
            .filter((option) => option.isActive)
            .sort(bySortOrderThenCode)
            .map((option) => ({
              code: option.code,
              name: option.name,
              priceAdjustment: option.priceAdjustment,
              visualAssetKey: option.visualAssetKey ?? null,
              isDefault: option.isDefault,
              sortOrder: option.sortOrder,
            })),
        })),
      compatibilityRules: product.compatibilityRules
        .filter((rule) => rule.isActive)
        .sort(byCode)
        .map((rule) => ({
          code: rule.code,
          type: rule.type,
          sourceOptionCodes: [...rule.sourceOptionCodes].sort(),
          targetOptionCodes: [...rule.targetOptionCodes].sort(),
          message: rule.message,
        })),
    },
  };
}

const catalogs = {};

for (const company of seed.companies) {
  for (const product of company.products) {
    if (!product.isActive || !product.isPublished) {
      continue;
    }
    catalogs[`${company.slug}/${product.code}`] = mapProduct(company, product);
  }
}

const entries = Object.keys(catalogs);

if (entries.length === 0) {
  throw new Error(`No published product found in ${seedPath}.`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(catalogs, null, 2)}\n`, "utf8");

console.log(`offline catalog: ${entries.length} products -> ${outputPath}`);
