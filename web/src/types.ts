export interface ApiError {
  code: string;
  message: string;
  target: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  errors: ApiError[];
  traceId: string;
}

export interface Branding {
  version: number;
  mode: "CoBranded";
  logoAssetKey: string | null;
  primaryColor: string;
  onPrimaryColor: string;
}

export interface PrivacyPolicy {
  activeVersion: string;
  resourceUrl: string;
  contentHashSha256: string;
  publishedAtUtc: string;
  quoteRetentionDays: number;
}

export interface CatalogOption {
  code: string;
  name: string;
  priceAdjustment: number;
  visualAssetKey: string | null;
  isDefault: boolean;
  sortOrder: number;
}

export interface CatalogOptionGroup {
  code: string;
  name: string;
  minSelections: number;
  maxSelections: number | null;
  sortOrder: number;
  options: CatalogOption[];
}

export interface CompatibilityRule {
  code: string;
  type: "RequiresAny";
  sourceOptionCodes: string[];
  targetOptionCodes: string[];
  message: string;
}

export interface ProductCatalog {
  company: {
    slug: string;
    name: string;
    locale: string;
    branding: Branding | null;
    privacyPolicy: PrivacyPolicy;
  };
  product: {
    code: string;
    name: string;
    description: string;
    catalogVersion: number;
    basePrice: number;
    currencyCode: string;
    priceDisclaimer: string;
    visualAssetKey: string | null;
    optionGroups: CatalogOptionGroup[];
    compatibilityRules: CompatibilityRule[];
  };
}

export interface PriceComponent {
  type: "BasePrice" | "OptionAdjustment";
  code: string;
  name: string;
  amount: number;
}

export interface ValidationData {
  isValid: boolean;
  catalogVersion: number;
  contentLocale: string;
  estimatedPrice: number | null;
  currencyCode: string;
  normalizedSelections: Array<{
    optionGroupCode: string;
    optionCodes: string[];
  }> | null;
  priceBreakdown: PriceComponent[] | null;
}

export interface CreatedConfiguration {
  configurationCode: string;
  companySlug: string;
  productCode: string;
  catalogVersionAtCreation: number;
  contentLocale: string;
  estimatedPrice: number;
  currencyCode: string;
  createdAtUtc: string;
  wasExisting: boolean;
}

export interface SavedConfiguration {
  configurationCode: string;
  contentLocale: string;
  company: {
    slug: string;
    name: string;
    branding: Branding | null;
  };
  product: {
    code: string;
    name: string;
    catalogVersionAtCreation: number;
  };
  selectedOptions: Array<{
    optionGroupCode: string;
    optionGroupName: string;
    optionCode: string;
    optionName: string;
    priceAdjustment: number;
    visualAssetKey: string | null;
  }>;
  priceBreakdown: PriceComponent[];
  estimatedPrice: number;
  currencyCode: string;
  visualState: unknown | null;
  createdAtUtc: string;
  isCurrentProductAvailable: boolean;
}

export interface CreatedQuoteRequest {
  quoteRequestCode: string;
  configurationCode: string;
  status: "New";
  createdAtUtc: string;
  retentionUntilUtc: string;
  wasExisting: boolean;
}

export interface DemoScenario {
  companySlug: string;
  productCode: string;
  label: string;
  description: string;
}
