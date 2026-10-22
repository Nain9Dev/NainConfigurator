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
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(here, "../../database/demo/technical-demo-catalogs.json");
const outputPath = resolve(here, "../public/offline-catalog.json");
const packSourceDir = resolve(here, "../../assets/visual-packs");
const packOutputDir = resolve(here, "../public/visual-packs");

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

/*
 * Visual packs are published assets addressed by `visualAssetKey`, exactly as a
 * GLB would be. They are authored under `assets/visual-packs` and staged into
 * `public/` so a static host serves them without a build step of their own.
 *
 * Every pack is re-serialized rather than copied: a document that is not JSON,
 * or whose file name does not match its own `key`, fails the build instead of
 * reaching the browser.
 */
const packNames = await listPacks(packSourceDir);
const declaredKeys = new Set(
  entries
    .map((entry) => catalogs[entry].product.visualAssetKey)
    .filter((key) => key !== null),
);

await rm(packOutputDir, { force: true, recursive: true });
await mkdir(packOutputDir, { recursive: true });

for (const name of packNames) {
  const key = name.replace(/\.json$/u, "");
  const pack = JSON.parse(await readFile(resolve(packSourceDir, name), "utf8"));

  if (pack.key !== key) {
    throw new Error(`Visual pack ${name} declares key "${pack.key}".`);
  }

  if (pack.schemaVersion !== 1) {
    throw new Error(`Visual pack ${name} has unsupported schemaVersion.`);
  }

  await writeFile(
    resolve(packOutputDir, name),
    `${JSON.stringify(pack)}\n`,
    "utf8",
  );
}

const unmatched = [...declaredKeys].filter(
  (key) => !packNames.includes(`${key}.json`),
);

console.log(
  `visual packs: ${packNames.length} staged -> ${packOutputDir}` +
    (unmatched.length > 0
      ? ` (no pack for ${unmatched.join(", ")}; those products use the fallback view)`
      : ""),
);

async function listPacks(directory) {
  try {
    const names = await readdir(directory);

    return names.filter((name) => name.endsWith(".json")).sort();
  } catch (reason) {
    if (reason.code === "ENOENT") {
      return [];
    }

    throw reason;
  }
}
