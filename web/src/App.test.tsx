import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import type { ProductCatalog } from "./types";

const productCatalog: ProductCatalog = {
  company: {
    slug: "generic-company",
    name: "Empresa de prueba",
    locale: "es-ES",
    branding: null,
    privacyPolicy: {
      activeVersion: "1",
      resourceUrl: "https://demo.invalid/privacy",
      contentHashSha256: "0".repeat(64),
      publishedAtUtc: "2026-07-30T00:00:00Z",
      quoteRetentionDays: 365,
    },
  },
  product: {
    code: "PRODUCT-001",
    name: "Producto genérico",
    description: "Producto generado mediante datos.",
    catalogVersion: 1,
    basePrice: 100,
    currencyCode: "EUR",
    priceDisclaimer: "Estimación sintética.",
    visualAssetKey: null,
    optionGroups: [
      {
        code: "SIZE",
        name: "Tamaño",
        minSelections: 1,
        maxSelections: 1,
        sortOrder: 1,
        options: [
          {
            code: "SIZE_SMALL",
            name: "Pequeño",
            priceAdjustment: 0,
            visualAssetKey: null,
            isDefault: true,
            sortOrder: 1,
          },
          {
            code: "SIZE_LARGE",
            name: "Grande",
            priceAdjustment: 25,
            visualAssetKey: null,
            isDefault: false,
            sortOrder: 2,
          },
        ],
      },
    ],
    compatibilityRules: [],
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("catalog-driven application shell", () => {
  it("renders the scenario manifest without product branches", async () => {
    window.history.replaceState({}, "", "/");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            companySlug: "generic-company",
            productCode: "PRODUCT-001",
            label: "Producto genérico",
            description: "Escenario sintético",
          },
        ]),
      ),
    );

    render(<App />);

    const link = (await screen.findByRole("link", {
      name: "Abrir configurador",
    })) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(
      "/configure/generic-company/PRODUCT-001",
    );
  });

  it("creates controls and draft price only from catalog data", async () => {
    window.history.replaceState(
      {},
      "",
      "/configure/generic-company/PRODUCT-001",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          success: true,
          data: productCatalog,
          errors: [],
          traceId: "synthetic-trace",
        }),
      ),
    );
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole("heading", {
      name: "Producto genérico",
    });
    const small = screen.getByRole("radio", {
      name: /Pequeño/,
    }) as HTMLInputElement;
    const large = screen.getByRole("radio", {
      name: /Grande/,
    }) as HTMLInputElement;

    expect(small.checked).toBe(true);
    await user.click(large);
    expect(large.checked).toBe(true);
    expect(screen.getByText(/125,00/)).toBeDefined();
  });
});

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
