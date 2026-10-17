"use client";

import { useFormStatus } from "react-dom";
import { IconAlert, IconCheck } from "@/components/icons";

/** Estado que devuelven las acciones de formulario. */
export type FormState = { error?: string; ok?: string; fieldErrors?: Record<string, string> } | null;

export function SubmitButton({
  children,
  pendingText = "Guardando…",
  className = "btn btn-p",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} name={name} value={value}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormAlert({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) {
    return (
      <div className="alert alert-error" role="alert">
        <IconAlert size={26} strokeWidth={2.4} />
        <span>{state.error}</span>
      </div>
    );
  }
  if (state.ok) {
    return (
      <div className="alert alert-ok" role="status">
        <IconCheck size={26} strokeWidth={2.6} />
        <span>{state.ok}</span>
      </div>
    );
  }
  return null;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="err">
      <IconAlert size={22} strokeWidth={2.4} />
      {message}
    </span>
  );
}
