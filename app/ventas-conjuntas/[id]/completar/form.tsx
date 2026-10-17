"use client";

import { useActionState } from "react";
import { invitarACaravana } from "@/app/acciones";
import { FormAlert, SubmitButton, type FormState } from "@/components/form-parts";
import { IconChat } from "@/components/icons";

type Grupo = { zona: string; lotes: string[] };

/** Botón "Invitar" de una localidad, o el de "los más cercanos" si se le pasan varias. */
export function InvitarForm({
  poolId,
  titulo,
  grupos,
  grande = false,
  texto,
}: {
  poolId: string;
  titulo: string;
  grupos: Grupo[];
  grande?: boolean;
  texto: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(invitarACaravana, null);
  return (
    <form action={action} className={grande ? "stack" : "invitar-form"}>
      <input type="hidden" name="pool_id" value={poolId} />
      <input type="hidden" name="titulo" value={titulo} />
      {grupos.map((g) => (
        <span key={g.zona}>
          <input type="hidden" name="zona" value={g.zona} />
          {g.lotes.map((l) => (
            <input key={l} type="hidden" name="lote" value={l} />
          ))}
        </span>
      ))}
      {state?.ok ? (
        <span className="tag tag-ok" role="status">Invitado</span>
      ) : (
        <SubmitButton pendingText="Enviando…" className={grande ? "btn btn-p" : "btn btn-s btn-inline"}>
          {grande ? <IconChat size={22} strokeWidth={2.4} /> : null}
          {texto}
        </SubmitButton>
      )}
      {grande || state?.error ? <FormAlert state={state} /> : null}
    </form>
  );
}
