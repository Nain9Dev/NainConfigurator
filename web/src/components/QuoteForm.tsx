import { type FormEvent, useRef, useState } from "react";

import { createQuoteRequest } from "../api";
import { formatDate } from "../catalog";
import { toApiErrors } from "../errors";
import { ErrorList, SuccessNotice } from "./Notices";
import type {
  ApiError,
  CreatedQuoteRequest,
  ProductCatalog,
  QuoteRequestInput,
  SavedConfiguration,
} from "../types";

export function QuoteForm({
  saved,
  catalog,
}: {
  saved: SavedConfiguration;
  catalog: ProductCatalog;
}) {
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [created, setCreated] = useState<CreatedQuoteRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const quoteAttempt = useRef<{ payload: string; requestId: string } | null>(
    null,
  );

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
    } satisfies Omit<QuoteRequestInput, "clientRequestId">;

    // Resubmitting identical contents reuses the identifier, so a retry after a
    // timeout resolves to the same quote request instead of a duplicate.
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
      setErrors(toApiErrors(reason));
    } finally {
      setBusy(false);
    }
  }

  if (created !== null) {
    return (
      <SuccessNotice>
        <strong>Solicitud registrada</strong>
        <span className="public-code">{created.quoteRequestCode}</span>
        <p>
          La demo solo ha guardado una intención técnica en el outbox; no se ha
          enviado ningún correo.
        </p>
        <p className="retention-note">
          Retención hasta el{" "}
          {formatDate(created.retentionUntilUtc, saved.contentLocale)} UTC,
          según la política vigente.
        </p>
      </SuccessNotice>
    );
  }

  return (
    <form onSubmit={submit} noValidate={false}>
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
        {errors.length > 0 && (
          <ErrorList errors={errors} title="Revisa el formulario" />
        )}
      </div>
    </form>
  );
}

function nullIfEmpty(value: string): string | null {
  const trimmed = value.trim();

  return trimmed.length === 0 ? null : trimmed;
}
