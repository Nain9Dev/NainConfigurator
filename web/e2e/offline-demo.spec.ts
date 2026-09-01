import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The journey a visitor takes on the published demo: no backend, no database,
 * every rule evaluated in the browser and labelled as non-authoritative.
 *
 * These assertions mirror the full-stack journeys in `technical-demo.spec.ts`,
 * so a behavioural divergence between the two backends surfaces here.
 */
test.describe("offline demo mode", () => {
  test("completes the commercial journey with no backend", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Una experiencia de configuración, productos distintos.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Abrir configurador/ }),
    ).toHaveCount(2);

    // The mode must be stated, not implied.
    await expect(
      page.getByText("Modo offline · estimación no autoritativa"),
    ).toBeVisible();
    await expect(page.getByText("Technical Demo")).toBeVisible();
    await assertNoAutomaticAccessibilityViolations(page);

    await page
      .getByRole("link", { name: /Abrir configurador/ })
      .first()
      .click();

    await expect(
      page.getByRole("heading", { name: "Escritorio modular" }),
    ).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(
      page.getByText(
        "Vista accesible de respaldo. Su estado nunca altera reglas ni precio.",
      ),
    ).toBeVisible();

    // A rule the catalog declares, broken on purpose.
    await page.getByRole("radio", { name: /Elevables eléctricas/ }).check();
    await expect(
      page
        .getByText(
          "Las patas elevables eléctricas requieren el tablero de 160 x 80 cm.",
        )
        .first(),
    ).toBeVisible();

    await page.getByRole("button", { name: "Validar selección" }).click();
    await expect(
      page
        .getByText(
          "Las patas elevables eléctricas requieren el tablero de 160 x 80 cm.",
        )
        .first(),
    ).toBeVisible();
    await assertNoAutomaticAccessibilityViolations(page);

    await page.getByRole("radio", { name: /160 x 80 cm/ }).check();
    await page.getByRole("button", { name: "Validar selección" }).click();
    await expect(page.getByText(/Selección válida:/)).toBeVisible();

    // The itemised price the API returns, shown line by line.
    await expect(
      page.getByRole("table", { name: /Desglose devuelto por la API/ }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Guardar configuración" }).click();
    const savedLink = page.getByRole("link", {
      name: /Ver configuración y solicitar presupuesto/,
    });
    await expect(savedLink).toBeVisible();
    await savedLink.click();

    await expect(
      page.getByRole("heading", { name: "Configuración guardada" }),
    ).toBeVisible();
    await expect(page.getByText(/^NCF-[0-9A-F]{24}$/)).toBeVisible();
    await assertNoAutomaticAccessibilityViolations(page);

    await page.getByLabel("Nombre ficticio").fill("Persona Sintética");
    await page
      .getByLabel("Correo ficticio")
      .fill("persona.sintetica@example.invalid");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Registrar solicitud" }).click();

    await expect(page.getByText("Solicitud registrada")).toBeVisible();
    await expect(page.getByText(/^NQR-[0-9A-F]{24}$/)).toBeVisible();
  });

  test("rejects a non-synthetic contact address", async ({ page }) => {
    await page.goto("/configure/naindev-demo/DESK-001");
    await page.getByRole("button", { name: "Guardar configuración" }).click();
    await page
      .getByRole("link", { name: /Ver configuración y solicitar presupuesto/ })
      .click();

    await page.getByLabel("Nombre ficticio").fill("Persona Sintética");
    await page.getByLabel("Correo ficticio").fill("real.person@example.com");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Registrar solicitud" }).click();

    await expect(
      page.getByText(
        "La demo técnica solo acepta correos ficticios terminados en .invalid.",
      ),
    ).toBeVisible();
    await expect(page.getByText("Solicitud registrada")).toHaveCount(0);
  });

  test("renders a second, unrelated product from the same shell", async ({
    page,
  }) => {
    await page.goto("/configure/nain-cycle-demo/BIKE-001");

    await expect(
      page.getByRole("heading", { name: "Bicicleta urbana de aventura" }),
    ).toBeVisible();
    await expect(page.getByRole("group")).not.toHaveCount(0);
    await assertNoAutomaticAccessibilityViolations(page);
  });

  test("restores a shared selection from the address", async ({ page }) => {
    await page.goto(
      "/configure/naindev-demo/DESK-001?option=SIZE_160_80&option=FINISH_OAK&option=LEG_ELECTRIC_STANDING",
    );

    await expect(
      page.getByRole("radio", { name: /160 x 80 cm/ }),
    ).toBeChecked();
    await expect(
      page.getByRole("radio", { name: /Elevables eléctricas/ }),
    ).toBeChecked();
  });

  test("reports an unknown configuration code without breaking", async ({
    page,
  }) => {
    await page.goto("/configurations/NCF-000000000000000000000000");

    await expect(
      page.getByText(/La configuración seleccionada no existe/),
    ).toBeVisible();
    await assertNoAutomaticAccessibilityViolations(page);
  });
});

async function assertNoAutomaticAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
}
