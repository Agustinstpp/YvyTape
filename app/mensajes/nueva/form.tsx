"use client";

import { useActionState, useState } from "react";
import { iniciarConsulta } from "@/app/acciones";
import { FieldError, FormAlert, SubmitButton, type FormState } from "@/components/form-parts";
import { IconLock, IconSend } from "@/components/icons";
import { CONTACT_INFO_ERROR, containsContactInfo } from "@/lib/front/contact-filter";

export function NuevaConsultaForm(props: { poolId: string; lotId: string; asunto: string; contexto: string }) {
  const [state, action] = useActionState<FormState, FormData>(iniciarConsulta, null);
  const [texto, setTexto] = useState("");
  const aviso = texto && containsContactInfo(texto) ? CONTACT_INFO_ERROR : undefined;

  return (
    <form action={action} className="stack" style={{ gap: 16 }}>
      <p className="alert alert-info" style={{ fontSize: 15 }}>
        <IconLock size={22} />
        Todo queda en YvyTape. No se pueden compartir teléfonos, correos ni enlaces.
      </p>
      <FormAlert state={state} />
      <input type="hidden" name="pool_id" value={props.poolId} />
      <input type="hidden" name="lot_id" value={props.lotId} />
      <input type="hidden" name="contexto" value={props.contexto} />
      <div className="field">
        <label htmlFor="asunto">Asunto</label>
        <input id="asunto" name="asunto" defaultValue={props.asunto} maxLength={120} required />
      </div>
      <div className="field">
        <label htmlFor="texto">Tu consulta</label>
        <textarea
          id="texto"
          name="texto"
          rows={5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-invalid={!!aviso}
          aria-describedby="e-texto"
          maxLength={1000}
          required
        />
        <FieldError id="e-texto" message={aviso} />
      </div>
      <SubmitButton pendingText="Enviando…">
        <IconSend size={24} />
        Enviar consulta
      </SubmitButton>
    </form>
  );
}
