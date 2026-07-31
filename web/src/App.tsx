import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ApiFailure,
  createConfiguration,
  createQuoteRequest,
  getConfiguration,
  getProduct,
  validateConfiguration,
} from "./api";
import {
  calculateDraftPrice,
  defaultSelections,
  formatMoney,
  selectedVisualKeys,
  updateSelection,
} from "./catalog";
import { parseRoute } from "./routes";
import type {
  ApiError,
  CreatedConfiguration,
  CreatedQuoteRequest,
  DemoScenario,
  ProductCatalog,
  SavedConfiguration,
  ValidationData,
} from "./types";

export function App() {
  const route = parseRoute(window.location);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      {route.type === "home" && <DemoHome />}
      {route.type === "configure" && (
        <ConfiguratorPage
          companySlug={route.companySlug}
          productCode={route.productCode}
          initialSelections={route.selectedOptionCodes}
        />
      )}
      {route.type === "configuration" && (
        <SavedConfigurationPage configurationCode={route.configurationCode} />
      )}
      {route.type === "notFound" && (
        <main id="main-content" className="centered-page">
          <p className="eyebrow">NainConfigurator</p>
          <h1>Página no encontrada</h1>
          <a className="button secondary" href="/">
            Volver a la demo
          </a>
        </main>
      )}
    </>
  );
}

function DemoHome() {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "NainConfigurator · Demo técnica";
    const controller = new AbortController();

    fetch("/demo-scenarios.json", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Demo scenario manifest unavailable.");
        }
        return (await response.json()) as DemoScenario[];
      })
      .then(setScenarios)
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException)) {
          setError("No se pudieron cargar los escenarios de la demo.");
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <main id="main-content" className="home">
      <section className="hero">
        <p className="eyebrow">Demo técnica local · datos sintéticos</p>
        <h1>Una experiencia de configuración, productos distintos.</h1>
        <p className="hero-copy">
          La interfaz, las reglas y el precio se construyen desde el catálogo.
          No hay propiedades ni ramas de código específicas de un escritorio.
        </p>
      </section>
      <section aria-labelledby="scenario-title">
        <div className="section-heading">
          <p className="section-index">01</p>
          <h2 id="scenario-title">Elige un escenario</h2>
        </div>
        {error !== null && <ErrorNotice message={error} />}
        {scenarios.length === 0 && error === null && (
          <p role="status">Cargando escenarios…</p>
        )}
        <div className="scenario-grid">
          {scenarios.map((scenario, index) => (
            <article className="scenario-card" key={scenario.companySlug}>
              <span className="scenario-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{scenario.label}</h3>
              <p>{scenario.description}</p>
              <a
                className="button"
                href={`/configure/${encodeURIComponent(scenario.companySlug)}/${encodeURIComponent(scenario.productCode)}`}
              >
                Abrir configurador
              </a>
            </article>
          ))}
        </div>
      </section>
      <DemoBoundary />
    </main>
  );
}

function ConfiguratorPage({
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
  const saveAttempt = useRef<{
    payload: string;
    requestId: string;
  } | null>(null);

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
          setErrors(toErrors(reason));
        }
      });

    return () => controller.abort();
  }, [companySlug, initialSelections, productCode]);

  const draftPrice = useMemo(
    () => (catalog === null ? 0 : calculateDraftPrice(catalog, selected)),
    [catalog, selected],
  );

  if (catalog === null) {
    return (
      <main id="main-content" className="centered-page">
        <a className="text-link" href="/">
          ← Escenarios
        </a>
        {errors.length > 0 ? (
          <ErrorList errors={errors} />
        ) : (
          <p role="status">Cargando catálogo…</p>
        )}
      </main>
    );
  }

  const brandStyle = {
    "--brand": catalog.company.branding?.primaryColor ?? "#173b57",
    "--on-brand": catalog.company.branding?.onPrimaryColor ?? "#ffffff",
  } as CSSProperties;

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
    setBusyAction("validate");
    setErrors([]);
    try {
      setValidation(await validateConfiguration(catalog!, selected));
    } catch (reason) {
      setValidation(null);
      setErrors(toErrors(reason));
    } finally {
      setBusyAction(null);
    }
  }

  async function save() {
    const payload = JSON.stringify([...selected].sort());
    const attempt =
      saveAttempt.current?.payload === payload
        ? saveAttempt.current
        : {
            payload,
            requestId: crypto.randomUUID(),
          };
    saveAttempt.current = attempt;
    setBusyAction("save");
    setErrors([]);

    try {
      const result = await createConfiguration(
        catalog!,
        selected,
        attempt.requestId,
      );
      setCreated(result);
      setValidation(null);
    } catch (reason) {
      setCreated(null);
      setErrors(toErrors(reason));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main id="main-content" className="configurator" style={brandStyle}>
      <header className="product-header">
        <div>
          <a className="text-link" href="/">
            ← Escenarios
          </a>
          <p className="eyebrow">{catalog.company.name}</p>
          <h1>{catalog.product.name}</h1>
          <p className="product-description">{catalog.product.description}</p>
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
        <section className="control-panel" aria-label="Opciones">
          {catalog.product.optionGroups.map((group) => {
            const isSingle = group.maxSelections === 1;
            const groupCodes = group.options.map((option) => option.code);
            const groupHasSelection = groupCodes.some((code) =>
              selected.includes(code),
            );

            return (
              <fieldset key={group.code}>
                <legend>
                  <span>{group.name}</span>
                  <small>
                    {group.minSelections > 0 ? "Obligatorio" : "Opcional"}
                  </small>
                </legend>
                <div className="option-list">
                  {isSingle && group.minSelections === 0 && (
                    <label className="option-card">
                      <input
                        checked={!groupHasSelection}
                        name={group.code}
                        onChange={() =>
                          changeSelection(groupCodes, null, true, true)
                        }
                        type="radio"
                      />
                      <span>
                        <strong>Sin selección</strong>
                        <small>Sin ajuste de precio</small>
                      </span>
                    </label>
                  )}
                  {group.options.map((option) => (
                    <label className="option-card" key={option.code}>
                      <input
                        checked={selected.includes(option.code)}
                        name={isSingle ? group.code : undefined}
                        onChange={(event) =>
                          changeSelection(
                            groupCodes,
                            option.code,
                            isSingle,
                            event.currentTarget.checked,
                          )
                        }
                        type={isSingle ? "radio" : "checkbox"}
                      />
                      <span>
                        <strong>{option.name}</strong>
                        <small>
                          {option.priceAdjustment === 0
                            ? "Incluido"
                            : `+ ${formatMoney(
                                option.priceAdjustment,
                                catalog.company.locale,
                                catalog.product.currencyCode,
                              )}`}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </section>

        <aside className="preview-column">
          <VisualFallback catalog={catalog} selectedOptionCodes={selected} />
          <div className="action-card">
            <p className="action-label">Validación autoritativa</p>
            <p>
              El servidor vuelve a comprobar reglas y precio antes de guardar.
            </p>
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
                <SuccessNotice
                  message={`Selección válida: ${formatMoney(
                    validation.estimatedPrice ?? 0,
                    validation.contentLocale,
                    validation.currencyCode,
                  )}`}
                />
              )}
              {created !== null && (
                <div className="success-notice">
                  <strong>Configuración guardada</strong>
                  <span>{created.configurationCode}</span>
                  <a
                    className="text-link"
                    href={`/configurations/${created.configurationCode}`}
                  >
                    Ver configuración y solicitar presupuesto →
                  </a>
                </div>
              )}
              {errors.length > 0 && <ErrorList errors={errors} />}
            </div>
          </div>
        </aside>
      </div>
      <DemoBoundary />
    </main>
  );
}

function VisualFallback({
  catalog,
  selectedOptionCodes,
}: {
  catalog: ProductCatalog;
  selectedOptionCodes: string[];
}) {
  const visualKeys = selectedVisualKeys(catalog, selectedOptionCodes);

  return (
    <section className="visual-fallback" aria-labelledby="preview-title">
      <div>
        <p className="section-index">Vista</p>
        <h2 id="preview-title">Composición del producto</h2>
      </div>
      <div
        className="visual-stage"
        role="img"
        aria-label={`${catalog.product.name}. ${visualKeys.length} componentes visuales seleccionados.`}
      >
        <span className="visual-orbit" aria-hidden="true" />
        <span className="visual-object" aria-hidden="true">
          {catalog.product.code}
        </span>
      </div>
      <details>
        <summary>Ver componentes visuales</summary>
        {visualKeys.length === 0 ? (
          <p>No hay componentes visuales adicionales.</p>
        ) : (
          <ul className="asset-list">
            {visualKeys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        )}
      </details>
      <p className="fallback-note">
        Vista accesible de respaldo. Su estado nunca altera reglas ni precio.
      </p>
    </section>
  );
}

function SavedConfigurationPage({
  configurationCode,
}: {
  configurationCode: string;
}) {
  const [saved, setSaved] = useState<SavedConfiguration | null>(null);
  const [catalog, setCatalog] = useState<ProductCatalog | null>(null);
  const [errors, setErrors] = useState<ApiError[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    getConfiguration(configurationCode, controller.signal)
      .then((configuration) => {
        setSaved(configuration);
        document.documentElement.lang =
          configuration.contentLocale.split("-")[0] ?? "es";
        document.title = `Configuración ${configuration.configurationCode} · NainConfigurator`;

        if (configuration.isCurrentProductAvailable) {
          return getProduct(
            configuration.company.slug,
            configuration.product.code,
            controller.signal,
          ).then(setCatalog);
        }
        return undefined;
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException)) {
          setErrors(toErrors(reason));
        }
      });

    return () => controller.abort();
  }, [configurationCode]);

  if (saved === null) {
    return (
      <main id="main-content" className="centered-page">
        {errors.length > 0 ? (
          <ErrorList errors={errors} />
        ) : (
          <p role="status">Cargando configuración…</p>
        )}
      </main>
    );
  }

  const editUrl = `/configure/${encodeURIComponent(
    saved.company.slug,
  )}/${encodeURIComponent(saved.product.code)}?${saved.selectedOptions
    .map((option) => `option=${encodeURIComponent(option.optionCode)}`)
    .join("&")}`;

  return (
    <main id="main-content" className="saved-page">
      <a className="text-link" href="/">
        ← Escenarios
      </a>
      <header className="saved-header">
        <div>
          <p className="eyebrow">{saved.company.name}</p>
          <h1>Configuración guardada</h1>
          <p className="public-code">{saved.configurationCode}</p>
        </div>
        <div className="price-block dark">
          <span>Estimación guardada</span>
          <strong>
            {formatMoney(
              saved.estimatedPrice,
              saved.contentLocale,
              saved.currencyCode,
            )}
          </strong>
        </div>
      </header>

      <div className="saved-grid">
        <section aria-labelledby="summary-title" className="summary-card">
          <div className="section-heading">
            <p className="section-index">01</p>
            <h2 id="summary-title">{saved.product.name}</h2>
          </div>
          <dl className="selection-summary">
            {saved.selectedOptions.map((option) => (
              <div key={option.optionCode}>
                <dt>{option.optionGroupName}</dt>
                <dd>
                  <span>{option.optionName}</span>
                  <span>
                    {formatMoney(
                      option.priceAdjustment,
                      saved.contentLocale,
                      saved.currencyCode,
                    )}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          {saved.isCurrentProductAvailable ? (
            <a className="button secondary" href={editUrl}>
              Editar como nueva configuración
            </a>
          ) : (
            <ErrorNotice message="El producto histórico puede consultarse, pero ya no admite nuevas configuraciones ni presupuestos." />
          )}
        </section>

        <section aria-labelledby="quote-title" className="quote-card">
          <div className="section-heading">
            <p className="section-index">02</p>
            <h2 id="quote-title">Solicitar presupuesto</h2>
          </div>
          {saved.isCurrentProductAvailable && catalog !== null ? (
            <QuoteForm saved={saved} catalog={catalog} />
          ) : saved.isCurrentProductAvailable ? (
            <p role="status">Cargando la política de privacidad vigente…</p>
          ) : (
            <p>No se admiten nuevas solicitudes para este producto.</p>
          )}
        </section>
      </div>
      <DemoBoundary />
    </main>
  );
}

function QuoteForm({
  saved,
  catalog,
}: {
  saved: SavedConfiguration;
  catalog: ProductCatalog;
}) {
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [created, setCreated] = useState<CreatedQuoteRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const quoteAttempt = useRef<{
    payload: string;
    requestId: string;
  } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      configurationCode: saved.configurationCode,
      contact: {
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: nullIfEmpty(String(form.get("phone") ?? "")),
      },
      message: nullIfEmpty(String(form.get("message") ?? "")),
      privacyPolicy: {
        acknowledged: form.get("privacyAcknowledged") === "on",
        version: catalog.company.privacyPolicy.activeVersion,
      },
    };
    const payload = JSON.stringify(input);
    const attempt =
      quoteAttempt.current?.payload === payload
        ? quoteAttempt.current
        : { payload, requestId: crypto.randomUUID() };
    quoteAttempt.current = attempt;
    setBusy(true);
    setErrors([]);

    try {
      setCreated(
        await createQuoteRequest({
          clientRequestId: attempt.requestId,
          ...input,
        }),
      );
    } catch (reason) {
      setCreated(null);
      setErrors(toErrors(reason));
    } finally {
      setBusy(false);
    }
  }

  if (created !== null) {
    return (
      <div className="success-notice" role="status">
        <strong>Solicitud registrada</strong>
        <span>{created.quoteRequestCode}</span>
        <p>
          La demo solo ha guardado una intención técnica en el outbox; no se ha
          enviado ningún correo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <p className="demo-form-warning">
        Usa únicamente datos ficticios. El correo debe terminar en{" "}
        <code>.invalid</code>.
      </p>
      <label>
        Nombre ficticio
        <input autoComplete="off" maxLength={150} name="name" required />
      </label>
      <label>
        Correo ficticio
        <input
          autoComplete="off"
          maxLength={254}
          name="email"
          placeholder="demo.user@example.invalid"
          required
          type="email"
        />
      </label>
      <label>
        Teléfono ficticio <span>(opcional)</span>
        <input autoComplete="off" maxLength={30} name="phone" type="tel" />
      </label>
      <label>
        Mensaje <span>(opcional)</span>
        <textarea maxLength={1000} name="message" rows={4} />
        <small>
          No incluyas datos personales reales, documentos ni información
          sensible.
        </small>
      </label>
      <label className="privacy-check">
        <input name="privacyAcknowledged" required type="checkbox" />
        <span>
          He leído el{" "}
          <a
            href={catalog.company.privacyPolicy.resourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            aviso de privacidad de la demo
          </a>
          . Esta confirmación no es consentimiento de marketing.
        </span>
      </label>
      <button className="button" disabled={busy} type="submit">
        {busy ? "Registrando…" : "Registrar solicitud"}
      </button>
      <div aria-live="polite">
        {errors.length > 0 && <ErrorList errors={errors} />}
      </div>
    </form>
  );
}

function ErrorList({ errors }: { errors: ApiError[] }) {
  return (
    <div className="error-notice" role="alert">
      <strong>Revisa la selección</strong>
      <ul>
        {errors.map((error, index) => (
          <li key={`${error.code}-${index}`}>{error.message}</li>
        ))}
      </ul>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="error-notice" role="alert">
      {message}
    </div>
  );
}

function SuccessNotice({ message }: { message: string }) {
  return (
    <div className="success-notice" role="status">
      {message}
    </div>
  );
}

function DemoBoundary() {
  return (
    <footer className="demo-boundary">
      <strong>Technical Demo</strong>
      <span>
        Ejecución local · datos sintéticos · sin envío de notificaciones · no
        preparada para clientes reales
      </span>
    </footer>
  );
}

function toErrors(reason: unknown): ApiError[] {
  if (reason instanceof ApiFailure) {
    return reason.response.errors;
  }

  return [
    {
      code: "CLIENT_ERROR",
      message:
        "No se pudo conectar con la demo. Comprueba que el servicio local está iniciado.",
      target: null,
    },
  ];
}

function nullIfEmpty(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
