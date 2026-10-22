import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.describe("synthetic technical demo", () => {
  test("completes the commercial journey without a renderer", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Un motor\..*Cualquier producto\./s,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Abrir configurador",
      }),
    ).toHaveCount(2);
    await expect(page.getByText("Technical Demo")).toBeVisible();
    await assertNoAutomaticAccessibilityViolations(page);

    await page
      .getByRole("link", {
        name: "Abrir configurador",
      })
      .first()
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Escritorio modular",
      }),
    ).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Restablecer vista" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "La escena se interpreta desde el catálogo. Su estado nunca altera reglas ni precio.",
      ),
    ).toBeVisible();

    await page
      .getByRole("radio", {
        name: /Elevables eléctricas/,
      })
      .check();
    await page
      .getByRole("button", {
        name: "Validar selección",
      })
      .click();
    await expect(
      page.getByText(
        "Las patas elevables eléctricas requieren el tablero de 160 x 80 cm.",
      ),
    ).toBeVisible();
    await assertNoAutomaticAccessibilityViolations(page);

    await page
      .getByRole("radio", {
        name: /160 x 80 cm/,
      })
      .check();
    await page
      .getByRole("button", {
        name: "Validar selección",
      })
      .click();
    await expect(page.getByText(/Selección válida:/)).toBeVisible();

    await page
      .getByRole("button", {
        name: "Guardar configuración",
      })
      .click();
    const savedLink = page.getByRole("link", {
      name: /Ver configuración y solicitar presupuesto/,
    });
    await expect(savedLink).toBeVisible();
    await savedLink.click();

    await expect(
      page.getByRole("heading", {
        name: "Configuración guardada",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Editar como nueva configuración",
      }),
    ).toHaveAttribute("href", /\/configure\/naindev-demo\/DESK-001\?option=/);
    await assertNoAutomaticAccessibilityViolations(page);

    await page.getByLabel("Nombre ficticio").fill("Persona Sintética");
    await page
      .getByLabel("Correo ficticio")
      .fill("persona.sintetica@example.invalid");
    await page.getByLabel(/He leído el aviso de privacidad/).check();
    await page
      .getByRole("button", {
        name: "Registrar solicitud",
      })
      .click();

    await expect(page.getByText("Solicitud registrada")).toBeVisible();
    await expect(
      page.getByText(/no se ha enviado ningún correo/i),
    ).toBeVisible();
    await assertNoAutomaticAccessibilityViolations(page);
  });

  test("uses the same UI for a fundamentally different product", async ({
    page,
  }) => {
    await page.goto("/configure/nain-cycle-demo/BIKE-001");

    await expect(
      page.getByRole("heading", {
        name: "Bicicleta urbana de aventura",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", {
        name: /Transmisión/,
      }),
    ).toBeVisible();

    await page
      .getByRole("radio", {
        name: /Asistencia eléctrica/,
      })
      .check();
    await page
      .getByRole("button", {
        name: "Validar selección",
      })
      .click();
    await expect(
      page.getByText(
        "La asistencia eléctrica requiere frenos de disco hidráulicos.",
      ),
    ).toBeVisible();

    await page
      .getByRole("radio", {
        name: /Disco hidráulico/,
      })
      .check();
    await page
      .getByRole("button", {
        name: "Validar selección",
      })
      .click();
    await expect(page.getByText(/Selección válida:/)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await assertNoAutomaticAccessibilityViolations(page);
  });

  test("supports keyboard entry and 320 pixel reflow", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({
      width: 320,
      height: 900,
    });
    await page.goto("/configure/naindev-demo/DESK-001");
    await expect(
      page.getByRole("heading", {
        name: "Escritorio modular",
      }),
    ).toBeVisible();

    if (testInfo.project.name === "chromium") {
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("link", {
          name: "Saltar al contenido",
        }),
      ).toBeFocused();
    }
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
  });
});

/**
 * `nain-ecosystem-bar` is a shared web component served from www.naindev.com.
 * It is not built, versioned or fixable from this repository, so scanning it
 * here would make this gate depend on another repository's deployment.
 */
async function assertNoAutomaticAccessibilityViolations(
  page: Page,
): Promise<void> {
  const results = await new AxeBuilder({ page })
    .exclude("nain-ecosystem-bar")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
}
