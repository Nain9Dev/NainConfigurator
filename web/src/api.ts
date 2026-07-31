import type {
  ApiResponse,
  CreatedConfiguration,
  CreatedQuoteRequest,
  ProductCatalog,
  SavedConfiguration,
  ValidationData,
} from "./types";

export class ApiFailure extends Error {
  public constructor(
    public readonly response: ApiResponse<unknown>,
    public readonly status: number,
  ) {
    super(response.errors[0]?.message ?? "No se pudo completar la solicitud.");
  }
}

export async function getProduct(
  companySlug: string,
  productCode: string,
  signal?: AbortSignal,
): Promise<ProductCatalog> {
  return request<ProductCatalog>(
    `/api/v1/companies/${encodeURIComponent(companySlug)}/products/${encodeURIComponent(productCode)}`,
    { signal },
  );
}

export async function validateConfiguration(
  catalog: ProductCatalog,
  selectedOptionCodes: string[],
): Promise<ValidationData> {
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
  return request<SavedConfiguration>(
    `/api/v1/configurations/${encodeURIComponent(configurationCode)}`,
    { signal },
  );
}

export async function createQuoteRequest(input: {
  clientRequestId: string;
  configurationCode: string;
  contact: {
    name: string;
    email: string;
    phone: string | null;
  };
  message: string | null;
  privacyPolicy: {
    acknowledged: boolean;
    version: string;
  };
}): Promise<CreatedQuoteRequest> {
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
