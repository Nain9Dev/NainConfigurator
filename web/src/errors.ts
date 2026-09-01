import { ApiFailure } from "./api";
import type { ApiError } from "./types";

/**
 * Normalises anything a call can reject with into the error list the UI
 * renders. A transport failure gets a stable client-side code so it reads the
 * same way as a server-side one.
 */
export function toApiErrors(reason: unknown): ApiError[] {
  if (reason instanceof ApiFailure) {
    return reason.response.errors.length > 0
      ? reason.response.errors
      : [
          {
            code: "UNEXPECTED_RESPONSE",
            message: "La respuesta del servicio no tenía el formato esperado.",
            target: null,
          },
        ];
  }

  return [
    {
      code: "CLIENT_ERROR",
      message:
        "No se pudo conectar con la demo. Comprueba que el servicio local está iniciado.",
      target: null,
    },
  ];
}
