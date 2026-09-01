import { useEffect, useState } from "react";

import { resolveMode } from "../api";
import {
  applyThemePreference,
  describeTheme,
  nextThemePreference,
  readThemePreference,
  type ThemePreference,
} from "../theme";
import { href } from "../routes";
import type { RuntimeMode } from "../types";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="wordmark" href={href("/")}>
        <span aria-hidden="true" className="wordmark-mark" />
        <span>
          Nain<b>Configurator</b>
        </span>
      </a>
      <div className="site-header-actions">
        <RuntimeBadge />
        <ThemeToggle />
      </div>
    </header>
  );
}

/**
 * Says out loud where the numbers on screen come from. A visitor who opens the
 * published demo has no backend behind it, and pretending otherwise would be
 * the one dishonest thing this project cannot afford.
 */
export function RuntimeBadge() {
  const [mode, setMode] = useState<RuntimeMode | null>(null);

  useEffect(() => {
    let active = true;

    void resolveMode().then((resolved) => {
      if (active) {
        setMode(resolved);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (mode === null) {
    return <span className="runtime-badge is-pending">Comprobando…</span>;
  }

  return mode === "live" ? (
    <span className="runtime-badge is-live">
      <span aria-hidden="true" className="runtime-dot" />
      API local · validación autoritativa
    </span>
  ) : (
    <span className="runtime-badge is-offline">
      <span aria-hidden="true" className="runtime-dot" />
      Modo offline · estimación no autoritativa
    </span>
  );
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = readThemePreference();
    setPreference(stored);
    applyThemePreference(stored);
  }, []);

  function cycle() {
    const next = nextThemePreference(preference);
    setPreference(next);
    applyThemePreference(next);
  }

  return (
    <button
      className="theme-toggle"
      onClick={cycle}
      type="button"
      aria-label={`${describeTheme(preference)}. Pulsa para cambiar.`}
    >
      <span aria-hidden="true" className={`theme-icon is-${preference}`} />
      <span className="theme-label">{describeTheme(preference)}</span>
    </button>
  );
}

export function DemoBoundary() {
  return (
    <footer className="demo-boundary">
      <div>
        <strong>Technical Demo</strong>
        <span>
          Ejecución local · datos sintéticos · sin envío de notificaciones · no
          preparada para clientes reales
        </span>
      </div>
      <p className="demo-boundary-license">
        Software libre bajo licencia AGPL-3.0-or-later.
      </p>
    </footer>
  );
}

export function Skeleton({
  lines = 3,
  label,
}: {
  lines?: number;
  label: string;
}) {
  return (
    <div className="skeleton" role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: lines }, (_, index) => (
        <span aria-hidden="true" className="skeleton-line" key={index} />
      ))}
    </div>
  );
}
