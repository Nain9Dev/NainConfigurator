import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createConfiguration,
  getProduct,
  validateConfiguration,
} from "../api";
import {
  calculateDraftPrice,
  defaultSelections,
  formatMoney,
  pendingRuleWarnings,
  unsatisfiedGroups,
  updateSelection,
} from "../catalog";
import { CopyButton } from "../components/CopyButton";
import { Skeleton } from "../components/Chrome";
import { OptionGroups } from "../components/OptionGroups";
import {
  ErrorList,
  SuccessNotice,
  WarningNotice,
} from "../components/Notices";
import { PriceBreakdown } from "../components/PriceBreakdown";
import { ProductVisual } from "../components/ProductVisual";
import { toApiErrors } from "../errors";
import { href } from "../routes";
import type {
  ApiError,
  CreatedConfiguration,
  ProductCatalog,
  ValidationData,
} from "../types";

export function ConfiguratorPage({
  companySlug,
  productCode,
  initialSelections,
}: {
  companySlug: string;
  productCode: string;
  initialSelections: string[];
}) {
  const [catalog, setCatalog] = useState<ProductCatalog | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [created, setCreated] = useState<CreatedConfiguration | null>(null);
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [busyAction, setBusyAction] = useState<"validate" | "save" | null>(
    null,
  );
  const saveAttempt = useRef<{ payload: string; requestId: string } | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();
    setCatalog(null);
    setErrors([]);

    getProduct(companySlug, productCode, controller.signal)
      .then((loaded) => {
        setCatalog(loaded);
        const knownCodes = new Set(
          loaded.product.optionGroups.flatMap((group) =>
            group.options.map((option) => option.code),
          ),
        );
        const restored = initialSelections.filter((code) =>
          knownCodes.has(code),
        );
        setSelected(restored.length > 0 ? restored : defaultSelections(loaded));
        document.documentElement.lang =
          loaded.company.locale.split("-")[0] ?? "es";
        document.title = `${loaded.product.name} · NainConfigurator`;
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException)) {
          setErrors(toApiErrors(reason));
        }
      });

    return () => controller.abort();
  }, [companySlug, initialSelections, productCode]);

  const draftPrice = useMemo(
    () => (catalog === null ? 0 : calculateDraftPrice(catalog, selected)),
    [catalog, selected],
  );

  const ruleWarnings = useMemo(
    () => (catalog === null ? [] : pendingRuleWarnings(catalog, selected)),
    [catalog, selected],
  );

  const missingGroups = useMemo(
    () => (catalog === null ? [] : unsatisfiedGroups(catalog, selected)),
    [catalog, selected],
  );

  if (catalog === null) {
    return (
      <main id="main-content" className="centered-page">
        <a className="text-link" href={href("/")}>
          <span aria-hidden="true">←</span> Escenarios
        </a>
        {errors.length > 0 ? (
          <ErrorList errors={errors} title="No se pudo abrir el producto" />
        ) : (
          <Skeleton label="Cargando catálogo…" lines={4} />
        )}
      </main>
    );
  }

  const brandStyle = {
    "--brand": catalog.company.branding?.primaryColor ?? "#173b57",
    "--on-brand": catalog.company.branding?.onPrimaryColor ?? "#ffffff",
  } as CSSProperties;

  const shareUrl = buildShareUrl(companySlug, productCode, selected);

  function changeSelection(
    groupCodes: string[],
    optionCode: string | null,
    singleSelection: boolean,
    checked: boolean,
  ) {
    setSelected((current) =>
      updateSelection(
        current,
        groupCodes,
        optionCode,
        singleSelection,
        checked,
      ),
    );
    setValidation(null);
    setCreated(null);
    setErrors([]);
    saveAttempt.current = null;
  }

  async function validate() {
    if (catalog === null) {
      return;
    }

    setBusyAction("validate");
    setErrors([]);

    try {
      setValidation(await validateConfiguration(catalog, selected));
    } catch (reason) {
      setValidation(null);
      setErrors(toApiErrors(reason));
    } finally {
      setBusyAction(null);
    }
  }

  async function save() {
    if (catalog === null) {
      return;
    }

    // The same selection retries under the same identifier, so a network
    // stumble cannot create a second configuration.
    const payload = JSON.stringify([...selected].sort());
    const attempt =
      saveAttempt.current?.payload === payload
        ? saveAttempt.current
        : { payload, requestId: crypto.randomUUID() };
    saveAttempt.current = attempt;
    setBusyAction("save");
    setErrors([]);

    try {
      const result = await createConfiguration(
        catalog,
        selected,
        attempt.requestId,
      );
      setCreated(result);
      setValidation(null);
    } catch (reason) {
      setCreated(null);
      setErrors(toApiErrors(reason));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main id="main-content" className="configurator" style={brandStyle}>
      <div className="breadcrumb">
        <a className="text-link" href={href("/")}>
          <span aria-hidden="true">←</span> Escenarios
        </a>
      </div>

      <header className="product-header">
        <div>
          <p className="eyebrow">{catalog.company.name}</p>
          <h1>{catalog.product.name}</h1>
          <p className="product-description">{catalog.product.description}</p>
          <p className="catalog-version">
            Catálogo v{catalog.product.catalogVersion} ·{" "}
            {catalog.product.optionGroups.length} grupos ·{" "}
            {catalog.product.compatibilityRules.length} reglas de
            compatibilidad
          </p>
        </div>
        <div className="price-block" aria-live="polite">
          <span>Estimación local</span>
          <strong>
            {formatMoney(
              draftPrice,
              catalog.company.locale,
              catalog.product.currencyCode,
            )}
          </strong>
          <small>{catalog.product.priceDisclaimer}</small>
        </div>
      </header>

      <div className="configurator-grid">
        <OptionGroups
          catalog={catalog}
          disabled={busyAction !== null}
          onChange={changeSelection}
          selectedOptionCodes={selected}
        />

        <aside className="preview-column">
          <ProductVisual catalog={catalog} selectedOptionCodes={selected} />

          <div className="action-card">
            <p className="action-label">Validación autoritativa</p>
            <p>
              El servidor vuelve a comprobar reglas y precio antes de guardar.
            </p>

            {(ruleWarnings.length > 0 || missingGroups.length > 0) && (
              <WarningNotice
                title="Previsualización de reglas del catálogo"
                messages={[
                  ...missingGroups.map(
                    (group) => `Falta elegir una opción en ${group.name}.`,
                  ),
                  ...ruleWarnings,
                ]}
              />
            )}

            <div className="action-row">
              <button
                className="button secondary"
                disabled={busyAction !== null}
                onClick={validate}
                type="button"
              >
                {busyAction === "validate" ? "Validando…" : "Validar selección"}
              </button>
              <button
                className="button"
                disabled={busyAction !== null}
                onClick={save}
                type="button"
              >
                {busyAction === "save" ? "Guardando…" : "Guardar configuración"}
              </button>
            </div>

            <div aria-live="polite" className="result-region">
              {validation?.isValid && (
                <>
                  <SuccessNotice>
                    {`Selección válida: ${formatMoney(
                      validation.estimatedPrice ?? 0,
                      validation.contentLocale,
                      validation.currencyCode,
                    )}`}
                  </SuccessNotice>
                  {validation.priceBreakdown !== null && (
                    <PriceBreakdown
                      caption="Desglose devuelto por la API"
                      components={validation.priceBreakdown}
                      currencyCode={validation.currencyCode}
                      locale={validation.contentLocale}
                      total={validation.estimatedPrice ?? 0}
                    />
                  )}
                </>
              )}

              {created !== null && (
                <SuccessNotice>
                  <strong>Configuración guardada</strong>
                  <span className="public-code">
                    {created.configurationCode}
                  </span>
                  <a
                    className="text-link"
                    href={href(`/configurations/${created.configurationCode}`)}
                  >
                    Ver configuración y solicitar presupuesto{" "}
                    <span aria-hidden="true">→</span>
                  </a>
                </SuccessNotice>
              )}

              {errors.length > 0 && <ErrorList errors={errors} />}
            </div>
          </div>

          <div className="share-card">
            <p className="action-label">Compartir esta selección</p>
            <p>
              La selección viaja en la dirección, así que un enlace reabre
              exactamente esta configuración sin guardarla.
            </p>
            <CopyButton label="Copiar enlace" value={shareUrl} />
          </div>
        </aside>
      </div>
    </main>
  );
}

function buildShareUrl(
  companySlug: string,
  productCode: string,
  selected: string[],
): string {
  const path = `/configure/${encodeURIComponent(companySlug)}/${encodeURIComponent(productCode)}`;
  const query = [...selected]
    .sort()
    .map((code) => `option=${encodeURIComponent(code)}`)
    .join("&");

  const relative = href(query.length > 0 ? `${path}?${query}` : path);

  return typeof window === "undefined"
    ? relative
    : new URL(relative, window.location.origin).toString();
}
