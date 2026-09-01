import { useMemo } from "react";

import { selectedVisualKeys } from "../catalog";
import type { ProductCatalog } from "../types";

/**
 * The accessible SL-002 fallback view.
 *
 * It draws the *composition* of a configuration, not the product: one plate per
 * selected visual asset key, stacked in catalog order, with a hue derived from
 * the key itself. That is why it works unchanged for a desk and for a bicycle —
 * it never needs to know which one it is drawing.
 *
 * The optional Babylon.js renderer replaces this panel through the approved
 * adapter without touching catalog, validation, persistence or the controls.
 * Nothing here can alter a rule or a price.
 */
export function ProductVisual({
  catalog,
  selectedOptionCodes,
}: {
  catalog: ProductCatalog;
  selectedOptionCodes: string[];
}) {
  const visualKeys = useMemo(
    () => selectedVisualKeys(catalog, selectedOptionCodes),
    [catalog, selectedOptionCodes],
  );

  const plates = visualKeys.slice(0, MAX_PLATES);
  const hidden = visualKeys.length - plates.length;

  return (
    <section className="visual-fallback" aria-labelledby="preview-title">
      <div className="panel-heading">
        <p className="section-index">Vista</p>
        <h2 id="preview-title">Composición del producto</h2>
      </div>

      <div
        className="visual-stage"
        role="img"
        aria-label={`${catalog.product.name}. ${visualKeys.length} componentes visuales seleccionados.`}
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
            {catalog.product.code}
          </text>
        </svg>
      </div>

      <details className="asset-details">
        <summary>
          Ver componentes visuales
          <span className="asset-count">{visualKeys.length}</span>
        </summary>
        {visualKeys.length === 0 ? (
          <p>No hay componentes visuales adicionales.</p>
        ) : (
          <ul className="asset-list">
            {visualKeys.map((key) => (
              <li key={key}>
                <span
                  aria-hidden="true"
                  className="asset-swatch"
                  style={{
                    ["--plate-hue" as string]: `${hue(key)}`,
                  }}
                />
                <code>{key}</code>
              </li>
            ))}
          </ul>
        )}
        {hidden > 0 && (
          <p className="asset-overflow">
            Se dibujan {MAX_PLATES} capas; la lista incluye las {hidden}{" "}
            restantes.
          </p>
        )}
      </details>

      <p className="fallback-note">
        Vista accesible de respaldo. Su estado nunca altera reglas ni precio.
      </p>
    </section>
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
