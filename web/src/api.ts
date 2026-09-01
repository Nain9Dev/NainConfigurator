/**
 * The shell's only door to the outside.
 *
 * Every call goes through `resolveMode()` first. When an ASP.NET Core host
 * answers `/health/ready`, requests hit the real API and SQL Server decides
 * what is valid and what it costs. When nothing answers — a static host such as
 * GitHub Pages, or a checkout with no database — the same calls are served by
 * the in-browser demo backend instead, and the shell marks every price it shows
 * as an unverified estimate.
 *
 * The probe runs once per page load and never blocks the first paint for more
 * than `PROBE_TIMEOUT_MS`.
 */

import * as offline from "./demo/offlineBackend";
import { OfflineApiFailure } from "./demo/offlineBackend";
import type {
  ApiResponse,
  CreatedConfiguration,
  CreatedQuoteRequest,
  ProductCatalog,
  QuoteRequestInput,
  RuntimeMode,
  SavedConfiguration,
  ValidationData,
} from "./types";

const PROBE_TIMEOUT_MS = 2_500;
const FORCED_OFFLINE = import.meta.env.VITE_FORCE_OFFLINE === "true";

export class ApiFailure extends Error {
  public constructor(
    public readonly response: ApiResponse<unknown>,
    public readonly status: number,
  ) {
    super(response.errors[0]?.message ?? "No se pudo completar la solicitud.");
    this.name = "ApiFailure";
  }
}

let modePromise: Promise<RuntimeMode> | null = null;

/** Resolves once per page load and is then reused by every call. */
export function resolveMode(): Promise<RuntimeMode> {
  modePromise ??= detectMode();
  return modePromise;
}

async function detectMode(): Promise<RuntimeMode> {
  if (FORCED_OFFLINE) {
    return "offline";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch("/health/ready", {
      signal: controller.signal,
      headers: { Accept: "text/plain" },
    });

    return response.ok ? "live" : "offline";
  } catch {
    return "offline";
  } finally {
    clearTimeout(timeout);
  }
}

export async function getProduct(
  companySlug: string,
  productCode: string,
  signal?: AbortSignal,
): Promise<ProductCatalog> {
  if ((await resolveMode()) === "offline") {
    return adapt(offline.getProduct(companySlug, productCode));
  }

  return request<ProductCatalog>(
    `/api/v1/companies/${encodeURIComponent(companySlug)}/products/${encodeURIComponent(productCode)}`,
    { signal },
  );
}

export async function validateConfiguration(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
): Promise<ValidationData> {
  if ((await resolveMode()) === "offline") {
    return adapt(offline.validateConfiguration(catalog, selectedOptionCodes));
  }

  return request<ValidationData>("/api/v1/configurations/validate", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      companySlug: catalog.company.slug,
      productCode: catalog.product.code,
      catalogVersion: catalog.product.catalogVersion,
      selectedOptionCodes,
    }),
  });
}

export async function createConfiguration(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
  clientRequestId: string,
): Promise<CreatedConfiguration> {
  if ((await resolveMode()) === "offline") {
    return adapt(
      offline.createConfiguration(
        catalog,
        selectedOptionCodes,
        clientRequestId,
      ),
    );
  }

  return request<CreatedConfiguration>("/api/v1/configurations", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      clientRequestId,
      companySlug: catalog.company.slug,
      productCode: catalog.product.code,
      catalogVersion: catalog.product.catalogVersion,
      selectedOptionCodes,
      visualState: null,
    }),
  });
}

export async function getConfiguration(
  configurationCode: string,
  signal?: AbortSignal,
): Promise<SavedConfiguration> {
  if ((await resolveMode()) === "offline") {
    return adapt(offline.getConfiguration(configurationCode));
  }

  return request<SavedConfiguration>(
    `/api/v1/configurations/${encodeURIComponent(configurationCode)}`,
    { signal },
  );
}

export async function createQuoteRequest(
  input: QuoteRequestInput,
): Promise<CreatedQuoteRequest> {
  if ((await resolveMode()) === "offline") {
    return adapt(offline.createQuoteRequest(input));
  }

  return request<CreatedQuoteRequest>("/api/v1/quote-requests", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(input),
  });
}

const jsonHeaders = {
  "Content-Type": "application/json",
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const envelope = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !envelope.success || envelope.data === null) {
    throw new ApiFailure(envelope as ApiResponse<unknown>, response.status);
  }

  return envelope.data;
}

/** Re-throws offline failures as `ApiFailure` so callers handle one type. */
async function adapt<T>(operation: Promise<T>): Promise<T> {
  try {
    return await operation;
  } catch (reason) {
    if (reason instanceof OfflineApiFailure) {
      throw new ApiFailure(reason.response, reason.status);
    }
    throw reason;
  }
}
