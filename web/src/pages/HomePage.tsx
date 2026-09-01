import { useEffect, useState } from "react";

import { ErrorNotice } from "../components/Notices";
import { Skeleton } from "../components/Chrome";
import { asset, href } from "../routes";
import type { DemoScenario } from "../types";

export function HomePage() {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "NainConfigurator · Demo técnica";
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

  return (
    <main id="main-content" className="home">
      <section className="hero">
        <p className="eyebrow">Demo técnica local · datos sintéticos</p>
        <h1>Una experiencia de configuración, productos distintos.</h1>
        <p className="hero-copy">
          La interfaz, las reglas y el precio se construyen desde el catálogo.
          No hay propiedades ni ramas de código específicas de un escritorio.
        </p>
        <dl className="hero-facts">
          <div>
            <dt>Productos</dt>
            <dd>2</dd>
          </div>
          <div>
            <dt>Ramas por producto</dt>
            <dd>0</dd>
          </div>
          <div>
            <dt>Esquema, API y release</dt>
            <dd>Compartidos</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="scenario-title">
        <div className="section-heading">
          <p className="section-index">01</p>
          <h2 id="scenario-title">Elige un escenario</h2>
        </div>

        {error !== null && <ErrorNotice message={error} />}
        {scenarios.length === 0 && error === null && (
          <Skeleton label="Cargando escenarios…" lines={2} />
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
                href={href(
                  `/configure/${encodeURIComponent(scenario.companySlug)}/${encodeURIComponent(scenario.productCode)}`,
                )}
              >
                Abrir configurador
                <span aria-hidden="true" className="button-arrow" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="thesis-title" className="thesis">
        <div className="section-heading">
          <p className="section-index">02</p>
          <h2 id="thesis-title">Qué demuestra</h2>
        </div>
        <ol className="thesis-list">
          <li>
            <h3>El catálogo genera la interfaz</h3>
            <p>
              Grupos de opciones, límites de selección y reglas de
              compatibilidad llegan como datos. Un producto nuevo se añade sin
              tocar el esquema, el contrato público ni el cliente.
            </p>
          </li>
          <li>
            <h3>El servidor decide</h3>
            <p>
              El navegador muestra una estimación mientras eliges. Antes de
              guardar nada, la API vuelve a cargar el catálogo, revalida y
              recalcula el precio. Su respuesta es la que cuenta.
            </p>
          </li>
          <li>
            <h3>Lo guardado no cambia</h3>
            <p>
              Una configuración guardada conserva su versión de catálogo, su
              desglose y su idioma. Publicar un catálogo nuevo no reescribe el
              pasado.
            </p>
          </li>
          <li>
            <h3>Sin 3D sigue funcionando</h3>
            <p>
              El renderizador es opcional y se carga aparte. El flujo comercial
              completo funciona con la vista accesible de respaldo, desde 320
              píxeles CSS y con teclado.
            </p>
          </li>
        </ol>
      </section>
    </main>
  );
}
