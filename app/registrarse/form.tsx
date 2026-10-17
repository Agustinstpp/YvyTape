"use client";

import { useActionState } from "react";
import { registrarse } from "@/app/acciones";
import { FieldError, FormAlert, SubmitButton, ZonasDatalist, type FormState } from "@/components/form-parts";
import { IconCheck } from "@/components/icons";

export function RegistroForm({ rolInicial }: { rolInicial: "productor" | "comprador" }) {
  const [state, action] = useActionState<FormState, FormData>(registrarse, null);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={action} className="stack" style={{ gap: 16 }} noValidate>
      <FormAlert state={state} />
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label" style={{ marginBottom: 6 }}>Soy</legend>
        <div className="choices">
          <label className="choice">
            <input type="radio" name="role" value="productor" defaultChecked={rolInicial === "productor"} />
            <span>Productor</span>
          </label>
          <label className="choice">
            <input type="radio" name="role" value="comprador" defaultChecked={rolInicial === "comprador"} />
            <span>Comprador</span>
          </label>
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="full_name">Nombre o establecimiento</label>
        <input id="full_name" name="full_name" autoComplete="name" aria-invalid={!!fe.full_name} aria-describedby="e-full_name" />
        <FieldError id="e-full_name" message={fe.full_name} />
      </div>
      <div className="field">
        <label htmlFor="zone">Localidad</label>
        <ZonasDatalist />
        <input id="zone" name="zone" list="zonas" autoComplete="off" placeholder="Por ejemplo: Curuzú Cuatiá" aria-invalid={!!fe.zone} aria-describedby="e-zone" />
        <FieldError id="e-zone" message={fe.zone} />
      </div>
      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" aria-invalid={!!fe.email} aria-describedby="e-email" />
        <FieldError id="e-email" message={fe.email} />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" aria-invalid={!!fe.password} aria-describedby="h-password e-password" />
        <span id="h-password" className="help">8 letras o números como mínimo.</span>
        <FieldError id="e-password" message={fe.password} />
      </div>
      <SubmitButton pendingText="Creando cuenta…">
        <IconCheck size={24} strokeWidth={2.6} />
        Crear cuenta
      </SubmitButton>
      <p className="small">No pedimos teléfono. Las consultas con compradores y con el equipo se hacen por Mensajes, dentro de YvyTape.</p>
    </form>
  );
}
