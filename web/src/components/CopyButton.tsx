import { useEffect, useRef, useState } from "react";

/**
 * Copies a value and confirms it in a live region, because a button whose only
 * feedback is a colour change tells a screen-reader user nothing.
 * Falls back to selecting nothing and reporting failure where the Clipboard API
 * is unavailable or denied, rather than pretending it worked.
 */
export function CopyButton({
  value,
  label,
  copiedLabel = "Copiado",
}: {
  value: string;
  label: string;
  copiedLabel?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  async function copy() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }

    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }

    timer.current = setTimeout(() => setState("idle"), 2_500);
  }

  return (
    <>
      <button className="copy-button" onClick={copy} type="button">
        <span aria-hidden="true" className="copy-icon" />
        {state === "copied" ? copiedLabel : label}
      </button>
      <span aria-live="polite" className="visually-hidden">
        {state === "copied" && `${copiedLabel}: ${value}`}
        {state === "failed" &&
          "No se pudo copiar automáticamente. Selecciona el texto y cópialo."}
      </span>
    </>
  );
}
