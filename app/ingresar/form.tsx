"use client";

import { useActionState, useState } from "react";
import { ingresar } from "@/app/acciones";
import { FormAlert, SubmitButton, type FormState } from "@/components/form-parts";
import { IconArrowRight } from "@/components/icons";

export function IngresarForm() {
  const [state, action] = useActionState<FormState, FormData>(ingresar, null);
  const [ver, setVer] = useState(false);

  return (
    <form action={action} className="stack" style={{ gap: 16 }}>
      <FormAlert state={state} />
      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="nombre@correo.com" />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            id="password"
            name="password"
            type={ver ? "text" : "password"}
            autoComplete="current-password"
            required
            style={{ flex: 1 }}
          />
          <button type="button" className="btn btn-s btn-inline" style={{ minHeight: 60 }} onClick={() => setVer((v) => !v)} aria-pressed={ver}>
            {ver ? "Ocultar" : "Ver"}
          </button>
        </div>
      </div>
      <SubmitButton pendingText="Entrando…">
        <IconArrowRight size={24} strokeWidth={2.4} />
        Entrar
      </SubmitButton>
    </form>
  );
}
