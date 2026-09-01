import type { ReactNode } from "react";

import type { ApiError } from "../types";

export function ErrorList({
  errors,
  title = "Revisa la selección",
}: {
  errors: ApiError[];
  title?: string;
}) {
  return (
    <div className="notice notice-error" role="alert">
      <strong>{title}</strong>
      <ul>
        {errors.map((error, index) => (
          <li key={`${error.code}-${index}`}>{error.message}</li>
        ))}
      </ul>
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="notice notice-error" role="alert">
      {message}
    </div>
  );
}

export function SuccessNotice({
  children,
  role = "status",
}: {
  children: ReactNode;
  role?: "status" | "alert";
}) {
  return (
    <div className="notice notice-success" role={role}>
      {children}
    </div>
  );
}

export function WarningNotice({
  title,
  messages,
}: {
  title: string;
  messages: string[];
}) {
  return (
    <div className="notice notice-warning">
      <strong>{title}</strong>
      <ul>
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
