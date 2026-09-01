import { useEffect, useState } from "react";

import { getConfiguration, getProduct } from "../api";
import { formatDate, formatMoney, formatSignedMoney } from "../catalog";
import { CopyButton } from "../components/CopyButton";
import { Skeleton } from "../components/Chrome";
import { ErrorList, ErrorNotice } from "../components/Notices";
import { PriceBreakdown } from "../components/PriceBreakdown";
import { QuoteForm } from "../components/QuoteForm";
import { toApiErrors } from "../errors";
import { href } from "../routes";
import type { ApiError, ProductCatalog, SavedConfiguration } from "../types";

export function SavedConfigurationPage({
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
          setErrors(toApiErrors(reason));
        }
      });

    return () => controller.abort();
  }, [configurationCode]);

  if (saved === null) {
    return (
      <main id="main-content" className="centered-page">
        <div className="breadcrumb">
          <a className="text-link" href={href("/")}>
            <span aria-hidden="true">←</span> Escenarios
          </a>
        </div>
        {errors.length > 0 ? (
          <ErrorList
            errors={errors}
            title="No se pudo abrir la configuración"
          />
        ) : (
          <Skeleton label="Cargando configuración…" lines={4} />
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
      <div className="breadcrumb">
        <a className="text-link" href={href("/")}>
          <span aria-hidden="true">←</span> Escenarios
        </a>
      </div>

      <header className="saved-header">
        <div>
          <p className="eyebrow">{saved.company.name}</p>
          <h1>Configuración guardada</h1>
          <p className="public-code">{saved.configurationCode}</p>
          <div className="saved-meta">
            <CopyButton label="Copiar código" value={saved.configurationCode} />
            <span>
              Creada el {formatDate(saved.createdAtUtc, saved.contentLocale)}{" "}
              UTC
            </span>
            <span>
              Catálogo v{saved.product.catalogVersionAtCreation} en el momento
              de guardar
            </span>
          </div>
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
          <small>
            Este importe queda congelado aunque cambie el catálogo.
          </small>
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
                    {formatSignedMoney(
                      option.priceAdjustment,
                      saved.contentLocale,
                      saved.currencyCode,
                    )}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <PriceBreakdown
            caption="Desglose inmutable guardado con la configuración"
            components={saved.priceBreakdown}
            currencyCode={saved.currencyCode}
            locale={saved.contentLocale}
            total={saved.estimatedPrice}
          />

          {saved.isCurrentProductAvailable ? (
            <a className="button secondary" href={href(editUrl)}>
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
            <QuoteForm catalog={catalog} saved={saved} />
          ) : saved.isCurrentProductAvailable ? (
            <Skeleton
              label="Cargando la política de privacidad vigente…"
              lines={3}
            />
          ) : (
            <p>No se admiten nuevas solicitudes para este producto.</p>
          )}
        </section>
      </div>
    </main>
  );
}
