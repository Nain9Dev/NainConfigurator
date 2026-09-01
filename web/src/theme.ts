/**
 * Colour scheme preference: system by default, overridable, remembered.
 *
 * The choice is written to `documentElement.dataset.theme` so the stylesheet
 * can resolve it with plain CSS. `localStorage` is optional here — a browser
 * that blocks it simply follows the operating system every time.
 */

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "nainconfigurator.theme";
const PREFERENCES: readonly ThemePreference[] = ["system", "light", "dark"];

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;

  if (preference === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = preference;
  }

  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // A blocked store only costs persistence, not the current choice.
  }
}

/** Cycles system → light → dark → system. */
export function nextThemePreference(
  current: ThemePreference,
): ThemePreference {
  const index = PREFERENCES.indexOf(current);

  return PREFERENCES[(index + 1) % PREFERENCES.length] ?? "system";
}

export function describeTheme(preference: ThemePreference): string {
  switch (preference) {
    case "light":
      return "Tema claro";
    case "dark":
      return "Tema oscuro";
    default:
      return "Tema del sistema";
  }
}

function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    PREFERENCES.includes(value as ThemePreference)
  );
}
