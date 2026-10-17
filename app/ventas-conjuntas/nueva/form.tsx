"use client";

import { useActionState } from "react";
import { crearVenta } from "@/app/acciones";
import { FormAlert, SubmitButton, type FormState } from "@/components/form-parts";
import { IconCheck } from "@/components/icons";
import { CATEGORIES, categoryLabel } from "@/lib/ui/format";

export function NuevaVentaForm({ zona }: { zona: string }) {
  const [state, action] = useActionState<FormState, FormData>(crearVenta, null);
  return (
    <form action={action} className="stack" style={{ gap: 16 }}>
      <FormAlert state={state} />
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label" style={{ marginBottom: 6 }}>Categoría</legend>
        <div className="choices">
          {CATEGORIES.map((c) => (
            <label key={c} className="choice">
              <input type="radio" name="category" value={c} required />
              <span>{categoryLabel(c)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="zone">Zona</label>
        <input id="zone" name="zone" defaultValue={zona} required />
        <span className="help">Solo se pueden sumar lotes de esta zona.</span>
      </div>
      <div className="field">
        <label htmlFor="target_heads">Objetivo de cabezas</label>
        <input id="target_heads" name="target_heads" inputMode="numeric" required />
        <span className="help">La cantidad que necesita el comprador, por ejemplo una jaula completa.</span>
      </div>
      <div className="field">
        <label htmlFor="title">
          Nombre de la venta <span style={{ fontWeight: 400 }}>(opcional)</span>
        </label>
        <input id="title" name="title" placeholder="Por ejemplo: Terneros de invierno" />
      </div>
      <SubmitButton pendingText="Creando…">
        <IconCheck size={24} strokeWidth={2.6} />
        Crear venta conjunta
      </SubmitButton>
    </form>
  );
}
