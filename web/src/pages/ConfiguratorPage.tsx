import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createConfiguration, getProduct, validateConfiguration } from "../api";
import {
  calculateDraftPrice,
  defaultSelections,
  formatMoney,
  formatSignedMoney,
  unsatisfiedGroups,
  unsatisfiedRules,
  updateSelection,
} from "../catalog";
import { CopyButton } from "../components/CopyButton";
import { Skeleton } from "../components/Chrome";
import { OptionGroups } from "../components/OptionGroups";
import { ErrorList, SuccessNotice, WarningNotice } from "../components/Notices";
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
import { useVisualPack } from "../visual/useVisualPack";

/**
 * The studio: the scene is the largest thing on the page, the controls sit
 * beside it, and the estimate with its two actions stays docked at the bottom
 * of the viewport. Document order is scene, controls, results, dock, which is
 * also the reading order a narrow viewport gets.
 */
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
  const packState = useVisualPack(catalog?.product.visualAssetKey ?? null);

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

  const brokenRules = useMemo(
    () => (catalog === null ? [] : unsatisfiedRules(catalog, selected)),
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
  const pendingCount = brokenRules.length + missingGroups.length;
  const hasResults =
    pendingCount > 0 ||
    validation?.isValid === true ||
    created !== null ||
    errors.length > 0;

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
      <header className="studio-bar">
        <a className="text-link back-link" href={href("/")}>
          <span aria-hidden="true">←</span> Escenarios
        </a>
        <div className="studio-title">
          <p className="eyebrow">{catalog.company.name}</p>
          <h1>{catalog.product.name}</h1>
        </div>
        <div className="studio-bar-actions">
          <span className="chip">
            Catálogo v{catalog.product.catalogVersion}
          </span>
          <CopyButton label="Copiar enlace" value={shareUrl} />
        </div>
      </header>

      <div className="studio">
        <ProductVisual
          catalog={catalog}
          packState={packState}
          selectedOptionCodes={selected}
        />

        <OptionGroups
          brokenRules={brokenRules}
          catalog={catalog}
          disabled={busyAction !== null}
          onChange={changeSelection}
          pack={packState.pack}
          selectedOptionCodes={selected}
        />

        <div
          aria-live="polite"
          className={`studio-results${hasResults ? "" : " is-empty"}`}
          id="studio-results"
        >
          {pendingCount > 0 && (
            <WarningNotice
              title="Antes de validar"
              messages={[
                ...missingGroups.map(
                  (group) => `Falta elegir una opción en ${group.name}.`,
                ),
                ...brokenRules.map((rule) => rule.message),
              ]}
            />
          )}

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
              <span className="public-code">{created.configurationCode}</span>
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

      <div className="dock">
        <div className="dock-price" aria-live="polite">
          <span className="dock-label">Estimación local</span>
          <strong>
            {formatMoney(
              draftPrice,
              catalog.company.locale,
              catalog.product.currencyCode,
            )}
          </strong>
          <small>
            {draftPrice === catalog.product.basePrice
              ? "Precio base"
              : `${formatSignedMoney(
                  draftPrice - catalog.product.basePrice,
                  catalog.company.locale,
                  catalog.product.currencyCode,
                )} sobre el precio base`}
          </small>
        </div>

        <p className="dock-note">{catalog.product.priceDisclaimer}</p>

        <div className="dock-actions">
          {pendingCount > 0 && (
            <a className="dock-status" href="#studio-results">
              {pendingCount === 1 ? "1 aviso" : `${pendingCount} avisos`}
            </a>
          )}
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
