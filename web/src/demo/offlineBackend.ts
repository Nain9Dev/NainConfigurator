/**
 * In-browser stand-in for the public API, used when no backend is reachable.
 *
 * It reproduces the observable contract of `PublicApiEndpoints`: the same
 * envelope, the same status codes, the same stable error codes and the same
 * idempotency behaviour. What it cannot reproduce is the property that matters
 * commercially — server authority. Nothing here is trustworthy, and the shell
 * says so on every screen that shows a price.
 *
 * State lives in `sessionStorage`, so a saved configuration survives the full
 * page navigation to `/configurations/:code` and disappears when the tab closes.
 * No personal data is persisted: the quote guard still rejects any address that
 * does not end in `.invalid`.
 */

import type {
  ApiError,
  ApiResponse,
  CreatedConfiguration,
  CreatedQuoteRequest,
  ProductCatalog,
  QuoteRequestInput,
  SavedConfiguration,
  ValidationData,
} from "../types";
import { asset } from "../routes";
import { evaluate } from "./evaluator";

const STORAGE_KEY = "nainconfigurator.offline.v1";
const CATALOG_FILE = "offline-catalog.json";

interface StoredConfiguration {
  configurationCode: string;
  companySlug: string;
  productCode: string;
  clientRequestId: string;
  saved: SavedConfiguration;
}

interface StoredQuote {
  quoteRequestCode: string;
  clientRequestId: string;
  configurationCode: string;
  createdAtUtc: string;
  retentionUntilUtc: string;
}

interface OfflineState {
  configurations: StoredConfiguration[];
  quotes: StoredQuote[];
}

export class OfflineApiFailure extends Error {
  public constructor(
    public readonly response: ApiResponse<unknown>,
    public readonly status: number,
  ) {
    super(response.errors[0]?.message ?? "No se pudo completar la solicitud.");
    this.name = "OfflineApiFailure";
  }
}

let catalogCache: Promise<Record<string, ProductCatalog>> | null = null;

function loadCatalogs(): Promise<Record<string, ProductCatalog>> {
  catalogCache ??= fetch(asset(CATALOG_FILE))
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Offline catalog unavailable (${response.status}).`);
      }
      return (await response.json()) as Record<string, ProductCatalog>;
    })
    .catch((reason: unknown) => {
      catalogCache = null;
      throw reason;
    });

  return catalogCache;
}

export async function getProduct(
  companySlug: string,
  productCode: string,
): Promise<ProductCatalog> {
  const catalogs = await loadCatalogs();
  const catalog = catalogs[`${companySlug}/${productCode}`];

  if (catalog === undefined) {
    throw failure(404, {
      code: "PRODUCT_NOT_FOUND",
      message: "El producto solicitado no existe.",
      target: "productCode",
    });
  }

  return catalog;
}

export async function validateConfiguration(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
): Promise<ValidationData> {
  const current = await getProduct(catalog.company.slug, catalog.product.code);

  if (catalog.product.catalogVersion !== current.product.catalogVersion) {
    throw failure(409, {
      code: "CATALOG_VERSION_OUTDATED",
      message:
        "El catálogo del producto ha cambiado. Vuelve a cargarlo antes de continuar.",
      target: "catalogVersion",
    });
  }

  const evaluation = evaluate(current, selectedOptionCodes);

  if (!evaluation.isValid) {
    throw new OfflineApiFailure(
      {
        success: false,
        data: null,
        errors: evaluation.errors,
        traceId: offlineTraceId(),
      },
      evaluation.errors.some((error) => error.code === "DUPLICATE_OPTION_CODE")
        ? 400
        : 422,
    );
  }

  return {
    isValid: true,
    catalogVersion: current.product.catalogVersion,
    contentLocale: current.company.locale,
    estimatedPrice: evaluation.estimatedPrice,
    currencyCode: current.product.currencyCode,
    normalizedSelections: evaluation.normalizedSelections,
    priceBreakdown: evaluation.priceBreakdown,
  };
}

export async function createConfiguration(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
  clientRequestId: string,
): Promise<CreatedConfiguration> {
  const state = readState();
  const existing = state.configurations.find(
    (item) => item.clientRequestId === clientRequestId,
  );

  if (existing !== undefined) {
    return toCreated(existing.saved, true);
  }

  const current = await getProduct(catalog.company.slug, catalog.product.code);
  const evaluation = evaluate(current, selectedOptionCodes);

  if (!evaluation.isValid) {
    throw new OfflineApiFailure(
      {
        success: false,
        data: null,
        errors: evaluation.errors,
        traceId: offlineTraceId(),
      },
      422,
    );
  }

  const saved: SavedConfiguration = {
    configurationCode: publicCode("NCF-"),
    contentLocale: current.company.locale,
    company: {
      slug: current.company.slug,
      name: current.company.name,
      branding: current.company.branding,
    },
    product: {
      code: current.product.code,
      name: current.product.name,
      catalogVersionAtCreation: current.product.catalogVersion,
    },
    selectedOptions: evaluation.selectedOptions,
    priceBreakdown: evaluation.priceBreakdown,
    estimatedPrice: evaluation.estimatedPrice ?? 0,
    currencyCode: current.product.currencyCode,
    visualState: null,
    createdAtUtc: new Date().toISOString(),
    isCurrentProductAvailable: true,
  };

  state.configurations.push({
    configurationCode: saved.configurationCode,
    companySlug: saved.company.slug,
    productCode: saved.product.code,
    clientRequestId,
    saved,
  });
  writeState(state);

  return toCreated(saved, false);
}

export async function getConfiguration(
  configurationCode: string,
): Promise<SavedConfiguration> {
  const stored = readState().configurations.find(
    (item) => item.configurationCode === configurationCode,
  );

  if (stored === undefined) {
    throw failure(404, {
      code: "CONFIGURATION_NOT_FOUND",
      message:
        "La configuración seleccionada no existe en esta sesión. El modo offline solo conserva lo guardado en esta pestaña.",
      target: "configurationCode",
    });
  }

  // Re-read the catalog so a deactivated product behaves as it would online.
  const catalogs = await loadCatalogs();
  const key = `${stored.companySlug}/${stored.productCode}`;

  return {
    ...stored.saved,
    isCurrentProductAvailable: key in catalogs,
  };
}

export async function createQuoteRequest(
  input: QuoteRequestInput,
): Promise<CreatedQuoteRequest> {
  const state = readState();
  const existing = state.quotes.find(
    (item) => item.clientRequestId === input.clientRequestId,
  );

  if (existing !== undefined) {
    return { ...toQuote(existing), wasExisting: true };
  }

  const configuration = state.configurations.find(
    (item) => item.configurationCode === input.configurationCode,
  );

  if (configuration === undefined) {
    throw failure(404, {
      code: "CONFIGURATION_NOT_FOUND",
      message: "La configuración seleccionada no existe.",
      target: "configurationCode",
    });
  }

  const errors = validateQuoteInput(input);

  if (errors.length > 0) {
    throw new OfflineApiFailure(
      {
        success: false,
        data: null,
        errors,
        traceId: offlineTraceId(),
      },
      errors[0]?.code === "SYNTHETIC_CONTACT_REQUIRED" ? 422 : 400,
    );
  }

  const createdAt = new Date();
  const retentionUntil = new Date(createdAt);
  retentionUntil.setUTCDate(retentionUntil.getUTCDate() + 365);

  const quote: StoredQuote = {
    quoteRequestCode: publicCode("NQR-"),
    clientRequestId: input.clientRequestId,
    configurationCode: input.configurationCode,
    createdAtUtc: createdAt.toISOString(),
    retentionUntilUtc: retentionUntil.toISOString(),
  };

  // The contact block is intentionally discarded. The demo proves that a
  // request was accepted; it never keeps the person who made it.
  state.quotes.push(quote);
  writeState(state);

  return { ...toQuote(quote), wasExisting: false };
}

function validateQuoteInput(input: QuoteRequestInput): ApiError[] {
  const errors: ApiError[] = [];
  const name = input.contact.name.trim();
  const email = input.contact.email.trim();

  if (name.length === 0 || name.length > 150) {
    errors.push({
      code: "NAME_REQUIRED",
      message: "El nombre es obligatorio.",
      target: "contact.name",
    });
  }

  if (email.length === 0) {
    errors.push({
      code: "EMAIL_REQUIRED",
      message: "El correo electrónico es obligatorio.",
      target: "contact.email",
    });
  } else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({
      code: "EMAIL_INVALID",
      message: "El correo electrónico no tiene un formato válido.",
      target: "contact.email",
    });
  } else if (!email.toLowerCase().endsWith(".invalid")) {
    errors.push({
      code: "SYNTHETIC_CONTACT_REQUIRED",
      message:
        "La demo técnica solo acepta correos ficticios terminados en .invalid.",
      target: "contact.email",
    });
  }

  if (!input.privacyPolicy.acknowledged) {
    errors.push({
      code: "PRIVACY_POLICY_NOT_ACKNOWLEDGED",
      message: "Debes confirmar que has leído la política de privacidad.",
      target: "privacyPolicy.acknowledged",
    });
  }

  if (input.privacyPolicy.version.trim().length === 0) {
    errors.push({
      code: "PRIVACY_POLICY_VERSION_REQUIRED",
      message: "La versión de la política de privacidad es obligatoria.",
      target: "privacyPolicy.version",
    });
  }

  return errors;
}

function toCreated(
  saved: SavedConfiguration,
  wasExisting: boolean,
): CreatedConfiguration {
  return {
    configurationCode: saved.configurationCode,
    companySlug: saved.company.slug,
    productCode: saved.product.code,
    catalogVersionAtCreation: saved.product.catalogVersionAtCreation,
    contentLocale: saved.contentLocale,
    estimatedPrice: saved.estimatedPrice,
    currencyCode: saved.currencyCode,
    createdAtUtc: saved.createdAtUtc,
    wasExisting,
  };
}

function toQuote(quote: StoredQuote): CreatedQuoteRequest {
  return {
    quoteRequestCode: quote.quoteRequestCode,
    configurationCode: quote.configurationCode,
    status: "New",
    createdAtUtc: quote.createdAtUtc,
    retentionUntilUtc: quote.retentionUntilUtc,
    wasExisting: false,
  };
}

function failure(status: number, error: ApiError): OfflineApiFailure {
  return new OfflineApiFailure(
    {
      success: false,
      data: null,
      errors: [error],
      traceId: offlineTraceId(),
    },
    status,
  );
}

/** Matches the server format: prefix plus 24 uppercase hex characters. */
function publicCode(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));

  return (
    prefix +
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function offlineTraceId(): string {
  return `offline-${crypto.randomUUID()}`;
}

function readState(): OfflineState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      return { configurations: [], quotes: [] };
    }

    const parsed = JSON.parse(raw) as Partial<OfflineState>;

    return {
      configurations: parsed.configurations ?? [],
      quotes: parsed.quotes ?? [],
    };
  } catch {
    return { configurations: [], quotes: [] };
  }
}

function writeState(state: OfflineState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // A full or unavailable session store degrades the demo, it does not
    // break it: the current screen keeps working from memory.
  }
}
