import { DemoBoundary, SiteHeader } from "./components/Chrome";
import { ConfiguratorPage } from "./pages/ConfiguratorPage";
import { HomePage } from "./pages/HomePage";
import { SavedConfigurationPage } from "./pages/SavedConfigurationPage";
import { href, parseRoute } from "./routes";

export function App() {
  const route = parseRoute(window.location);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <SiteHeader />

      {route.type === "home" && <HomePage />}
      {route.type === "configure" && (
        <ConfiguratorPage
          companySlug={route.companySlug}
          initialSelections={route.selectedOptionCodes}
          productCode={route.productCode}
        />
      )}
      {route.type === "configuration" && (
        <SavedConfigurationPage configurationCode={route.configurationCode} />
      )}
      {route.type === "notFound" && (
        <main id="main-content" className="centered-page">
          <p className="eyebrow">NainConfigurator</p>
          <h1>Página no encontrada</h1>
          <p className="hero-copy">
            La dirección no corresponde a ningún escenario, producto o
            configuración de la demo.
          </p>
          <a className="button secondary" href={href("/")}>
            Volver a la demo
          </a>
        </main>
      )}

      <DemoBoundary />
    </>
  );
}
