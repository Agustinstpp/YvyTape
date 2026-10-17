"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { enviarMensaje } from "@/app/acciones";
import { FieldError, SubmitButton, type FormState } from "@/components/form-parts";
import { IconSend } from "@/components/icons";
import { CONTACT_INFO_ERROR, containsContactInfo } from "@/lib/front/contact-filter";

export function EnviarForm({ conversacionId }: { conversacionId: string }) {
  const [state, action] = useActionState<FormState, FormData>(enviarMensaje, null);
  const [texto, setTexto] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Avisa antes de enviar si el texto trae un teléfono, correo o enlace.
  const aviso = texto && containsContactInfo(texto) ? CONTACT_INFO_ERROR : state?.error;

  useEffect(() => {
    if (state && !state.error) setTexto("");
  }, [state]);

  return (
    <form ref={formRef} action={action} className="stack">
      <input type="hidden" name="conversacion_id" value={conversacionId} />
      <div className="field">
        <label htmlFor="texto">Tu mensaje</label>
        <textarea
          id="texto"
          name="texto"
          rows={3}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-invalid={!!aviso}
          aria-describedby="e-texto"
          maxLength={1000}
        />
        <FieldError id="e-texto" message={aviso} />
      </div>
      <SubmitButton pendingText="Enviando…">
        <IconSend size={24} />
        Enviar
      </SubmitButton>
    </form>
  );
}
