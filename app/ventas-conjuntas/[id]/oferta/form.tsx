"use client";

import { useActionState, useState } from "react";
import { responderOferta } from "@/app/acciones";
import { FormAlert, SubmitButton, type FormState } from "@/components/form-parts";
import { IconCheck, IconX } from "@/components/icons";

export function ResponderForm({ poolId, offerId }: { poolId: string; offerId: string }) {
  const [state, action] = useActionState<FormState, FormData>(responderOferta, null);
  const [rechazar, setRechazar] = useState(false);

  return (
    <form action={action} className="stack">
      <FormAlert state={state} />
      <input type="hidden" name="pool_id" value={poolId} />
      <input type="hidden" name="offer_id" value={offerId} />
      {rechazar ? (
        <>
          <p className="alert alert-error">Si no aceptás, la oferta se cae para todos los productores de la venta. ¿Confirmás?</p>
          <SubmitButton className="btn btn-big btn-s" name="respuesta" value="no" pendingText="Enviando…">
            <IconX size={28} strokeWidth={2.8} />
            Sí, no acepto
          </SubmitButton>
          <button type="button" className="btn btn-s" onClick={() => setRechazar(false)}>
            Volver a la oferta
          </button>
        </>
      ) : (
        <>
          <SubmitButton className="btn btn-big btn-p" name="respuesta" value="si" pendingText="Enviando…">
            <IconCheck size={30} strokeWidth={2.8} />
            Acepto mi parte
          </SubmitButton>
          <button type="button" className="btn btn-big btn-s" onClick={() => setRechazar(true)}>
            <IconX size={28} strokeWidth={2.8} />
            No acepto
          </button>
        </>
      )}
    </form>
  );
}
