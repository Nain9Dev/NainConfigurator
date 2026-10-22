import { useEffect, useState } from "react";

import { getProduct } from "../api";
import { defaultSelections, selectedVisualKeys } from "../catalog";
import { ErrorNotice } from "../components/Notices";
import { Skeleton } from "../components/Chrome";
import { asset, href } from "../routes";
import type { DemoScenario, ProductCatalog } from "../types";
import { Stage } from "../visual/Stage";
import { useVisualPack } from "../visual/useVisualPack";

/**
 * The home page shows the product before it explains the engine: a scene the
 * visitor can rotate, one line, one button. Everything the cards state about a
 * scenario is read from its catalog, so the page cannot drift from the data.
 */
export function HomePage() {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const catalogs = useScenarioCatalogs(scenarios);

  useEffect(() => {
    document.title =
      "NainConfigurator · Configurador B2B dirigido por catálogo";
    const controller = new AbortController();

    fetch(asset("demo-scenarios.json"), { signal: controller.signal })
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

  const firstScenario = scenarios[0];

  return (
    <main id="main-content" className="home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy-block">
          <h1 id="hero-title">
            Un motor. <span className="hero-accent">Cualquier producto.</span>
          </h1>
          <p className="hero-copy">
            La interfaz, las reglas, el precio y la escena salen del catálogo.
            Cero ramas por cliente.
          </p>
          <div className="hero-actions">
            {firstScenario !== undefined && (
              <a
                className="button is-large"
                href={configureHref(firstScenario)}
              >
                Probar el configurador
                <span aria-hidden="true" className="button-arrow" />
              </a>
            )}
            <a className="button secondary is-large" href="#escenarios">
              Ver productos
            </a>
          </div>
        </div>

        <HeroShowcase catalogs={catalogs} scenarios={scenarios} />
      </section>

      <ul className="fact-strip" aria-label="En cifras">
        <li>
          <strong>0</strong>
          <span>ramas por cliente</span>
        </li>
        <li>
          <strong>1</strong>
          <span>API para todo</span>
        </li>
        <li>
          <strong>{scenarios.length > 0 ? scenarios.length : "2"}</strong>
          <span>productos sin relación</span>
        </li>
        <li>
          <strong>AA</strong>
          <span>WCAG 2.2</span>
        </li>
      </ul>

      <section aria-labelledby="scenario-title" id="escenarios">
        <div className="section-heading">
          <h2 id="scenario-title">Elige un producto</h2>
          <p className="section-lead">Dos empresas, un solo motor.</p>
        </div>

        {error !== null && <ErrorNotice message={error} />}
        {scenarios.length === 0 && error === null && (
          <Skeleton label="Cargando escenarios…" lines={2} />
        )}

        <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <ScenarioCard
              catalog={catalogs[scenarioKey(scenario)] ?? null}
              key={scenarioKey(scenario)}
              scenario={scenario}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="how-title" className="how" id="como-funciona">
        <div className="section-heading">
          <h2 id="how-title">Cómo funciona</h2>
          <p className="section-lead">El catálogo manda. El servidor decide.</p>
        </div>

        <ol className="steps">
          {STEPS.map((step, index) => (
            <li className={`step is-${step.tone}`} key={step.title}>
              <span aria-hidden="true" className="step-index">
                {index + 1}
              </span>
              <span aria-hidden="true" className="step-icon">
                {step.icon}
              </span>
              <h3>{step.title}</h3>
              <p>{step.line}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

const STEPS = [
  {
    tone: "data",
    title: "Catálogo",
    line: "Productos, opciones y reglas son filas.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </svg>
    ),
  },
  {
    tone: "domain",
    title: "Dominio",
    line: "Valida, fija el precio y congela lo guardado.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    tone: "shell",
    title: "Navegador",
    line: "Monta los controles y dibuja la escena.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M3 9h18M8 21h8" />
      </svg>
    ),
  },
] as const;

/**
 * The hero scene: the active scenario's default configuration, rotatable, with
 * a switch between scenarios when there is more than one.
 */
function HeroShowcase({
  scenarios,
  catalogs,
}: {
  scenarios: DemoScenario[];
  catalogs: Record<string, ProductCatalog>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = scenarios[activeIndex] ?? scenarios[0];
  const catalog =
    active === undefined ? null : (catalogs[scenarioKey(active)] ?? null);
  const { status, pack } = useVisualPack(
    catalog?.product.visualAssetKey ?? null,
  );

  return (
    <div className="hero-showcase">
      <div className="hero-stage">
        {catalog !== null && status === "ready" && pack !== null ? (
          <Stage
            aspect={4 / 3}
            pack={pack}
            productName={catalog.product.name}
            selectedVisualKeys={selectedVisualKeys(
              catalog,
              defaultSelections(catalog),
            )}
          />
        ) : (
          <div aria-hidden="true" className="hero-stage-pending" />
        )}
      </div>

      {scenarios.length > 1 && (
        <div className="hero-switch" role="group" aria-label="Producto">
          {scenarios.map((scenario, index) => {
            const name =
              catalogs[scenarioKey(scenario)]?.product.name ?? scenario.label;

            return (
              <button
                aria-pressed={index === activeIndex}
                className="hero-switch-button"
                key={scenarioKey(scenario)}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScenarioCard({
  scenario,
  catalog,
}: {
  scenario: DemoScenario;
  catalog: ProductCatalog | null;
}) {
  const { status, pack } = useVisualPack(
    catalog?.product.visualAssetKey ?? null,
  );

  const facts =
    catalog === null
      ? null
      : {
          groups: catalog.product.optionGroups.length,
          options: catalog.product.optionGroups.reduce(
            (count, group) => count + group.options.length,
            0,
          ),
          rules: catalog.product.compatibilityRules.length,
        };

  return (
    <article className="scenario-card">
      <div className="scenario-preview">
        {catalog !== null && status === "ready" && pack !== null ? (
          <Stage
            aspect={16 / 10}
            interactive={false}
            pack={pack}
            productName={catalog.product.name}
            selectedVisualKeys={selectedVisualKeys(
              catalog,
              defaultSelections(catalog),
            )}
          />
        ) : (
          <div aria-hidden="true" className="scenario-preview-pending" />
        )}
      </div>

      <div className="scenario-body">
        <p className="eyebrow">{catalog?.company.name ?? scenario.label}</p>
        <h3>{catalog?.product.name ?? scenario.label}</h3>
        <p className="scenario-line">{scenario.description}</p>

        {facts !== null && (
          <ul className="fact-chips" aria-label="Catálogo">
            <li>
              <strong>{facts.groups}</strong> grupos
            </li>
            <li>
              <strong>{facts.options}</strong> opciones
            </li>
            <li>
              <strong>{facts.rules}</strong>{" "}
              {facts.rules === 1 ? "regla" : "reglas"}
            </li>
          </ul>
        )}

        <a className="button" href={configureHref(scenario)}>
          Abrir configurador
          <span aria-hidden="true" className="button-arrow" />
        </a>
      </div>
    </article>
  );
}

/** Loads every scenario's catalog once; a failure leaves that card without facts. */
function useScenarioCatalogs(
  scenarios: DemoScenario[],
): Record<string, ProductCatalog> {
  const [catalogs, setCatalogs] = useState<Record<string, ProductCatalog>>({});

  useEffect(() => {
    const controller = new AbortController();

    for (const scenario of scenarios) {
      getProduct(scenario.companySlug, scenario.productCode, controller.signal)
        .then((catalog) => {
          if (!controller.signal.aborted) {
            setCatalogs((current) => ({
              ...current,
              [scenarioKey(scenario)]: catalog,
            }));
          }
        })
        .catch(() => {
          // A card without facts still links to the configurator.
        });
    }

    return () => controller.abort();
  }, [scenarios]);

  return catalogs;
}

function scenarioKey(scenario: DemoScenario): string {
  return `${scenario.companySlug}/${scenario.productCode}`;
}

function configureHref(scenario: DemoScenario): string {
  return href(
    `/configure/${encodeURIComponent(scenario.companySlug)}/${encodeURIComponent(scenario.productCode)}`,
  );
}
