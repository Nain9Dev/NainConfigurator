import { useMemo } from "react";

import { selectedVisualKeys } from "../catalog";
import type { ProductCatalog } from "../types";
import { Stage } from "../visual/Stage";
import type { PackState } from "../visual/useVisualPack";

/**
 * The scene panel.
 *
 * It draws the *composition* of a configuration, never a product this code
 * knows about. When the catalog's `visualAssetKey` resolves to a published
 * visual pack, a generic scene renderer interprets that pack against the
 * selected option keys. When it does not — no pack, offline, malformed — the
 * accessible plate stack takes over and the commercial flow is unaffected.
 *
 * Neither view can alter a rule or a price.
 */
export function ProductVisual({
  catalog,
  selectedOptionCodes,
  packState,
}: {
  catalog: ProductCatalog;
  selectedOptionCodes: string[];
  packState: PackState;
}) {
  const visualKeys = useMemo(
    () => selectedVisualKeys(catalog, selectedOptionCodes),
    [catalog, selectedOptionCodes],
  );

  const { status, pack } = packState;
  const isScene = status === "ready" && pack !== null;

  return (
    <section className="studio-stage" aria-labelledby="preview-title">
      <h2 className="visually-hidden" id="preview-title">
        {isScene ? "Previsualización" : "Composición del producto"}
      </h2>

      {isScene ? (
        <Stage
          pack={pack}
          productName={catalog.product.name}
          selectedVisualKeys={visualKeys}
        />
      ) : (
        <PlateStack
          isLoading={status === "loading"}
          productCode={catalog.product.code}
          productName={catalog.product.name}
          visualKeys={visualKeys}
        />
      )}

      <div className="stage-footer">
        <p className="stage-caption">
          {isScene
            ? "La escena se interpreta desde el catálogo. Su estado nunca altera reglas ni precio."
            : "Vista accesible de respaldo. Su estado nunca altera reglas ni precio."}
        </p>

        <details className="asset-details">
          <summary>
            Ver componentes visuales
            <span className="asset-count">{visualKeys.length}</span>
          </summary>
          {visualKeys.length === 0 ? (
            <p className="asset-overflow">
              No hay componentes visuales adicionales.
            </p>
          ) : (
            <ul className="asset-list">
              {visualKeys.map((key) => (
                <li key={key}>
                  <span
                    aria-hidden="true"
                    className="asset-swatch"
                    style={{ ["--plate-hue" as string]: `${hue(key)}` }}
                  />
                  <code>{key}</code>
                </li>
              ))}
            </ul>
          )}
        </details>
      </div>
    </section>
  );
}

/**
 * The fallback: one plate per selected visual asset key, stacked in catalog
 * order, with a hue derived from the key itself. It needs no pack and no
 * knowledge of the product, which is exactly why it is the safe floor.
 */
function PlateStack({
  visualKeys,
  productCode,
  productName,
  isLoading,
}: {
  visualKeys: string[];
  productCode: string;
  productName: string;
  isLoading: boolean;
}) {
  const plates = visualKeys.slice(0, MAX_PLATES);
  const hidden = visualKeys.length - plates.length;

  return (
    <>
      <div
        className={`visual-stage${isLoading ? " is-loading" : ""}`}
        role="img"
        aria-label={`${productName}. ${visualKeys.length} componentes visuales seleccionados.`}
      >
        <svg
          aria-hidden="true"
          className="visual-svg"
          viewBox="0 0 320 240"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="visual-floor" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--visual-floor-top)" />
              <stop offset="100%" stopColor="var(--visual-floor-bottom)" />
            </linearGradient>
          </defs>

          <rect fill="url(#visual-floor)" height="240" width="320" />
          <ellipse
            className="visual-shadow"
            cx="160"
            cy="196"
            rx="104"
            ry="20"
          />

          {plates.length === 0 ? (
            <g className="visual-plate is-empty">
              <polygon points={platePoints(0)} />
            </g>
          ) : (
            plates.map((key, index) => (
              <g
                className="visual-plate"
                key={key}
                style={{
                  // Depth from position, identity from the key: the same
                  // option always draws in the same colour.
                  ["--plate-hue" as string]: `${hue(key)}`,
                  ["--plate-delay" as string]: `${index * 70}ms`,
                }}
              >
                <polygon points={platePoints(plates.length - 1 - index)} />
              </g>
            ))
          )}

          <text className="visual-caption" x="160" y="228">
            {productCode}
          </text>
        </svg>
      </div>

      {hidden > 0 && (
        <p className="asset-overflow">
          Se dibujan {MAX_PLATES} capas; la lista incluye las {hidden}{" "}
          restantes.
        </p>
      )}
    </>
  );
}

const MAX_PLATES = 6;

/** Isometric plate, raised by its index in the stack. */
function platePoints(level: number): string {
  const lift = level * 21;
  const centerX = 160;
  const centerY = 168 - lift;
  const halfWidth = 96;
  const halfHeight = 34;

  return [
    `${centerX},${centerY - halfHeight}`,
    `${centerX + halfWidth},${centerY}`,
    `${centerX},${centerY + halfHeight}`,
    `${centerX - halfWidth},${centerY}`,
  ].join(" ");
}

/** Stable hue in [0, 360) derived from the asset key. */
function hue(key: string): number {
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 360_000;
  }

  return hash % 360;
}
