"use client";

import { useActionState, useState } from "react";
import { cerrarVenta, ofertar, salirDeVenta, sumarLote } from "@/app/acciones";
import { FormAlert, SubmitButton, type FormState } from "@/components/form-parts";
import { IconCheck, IconPlus, IconTag, IconX } from "@/components/icons";
import { fmtInt, fmtKg, fmtMoney } from "@/lib/ui/format";

export function SumarForm({ poolId, lotes }: { poolId: string; lotes: { id: string; label: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(sumarLote, null);
  return (
    <form action={action} className="card stack">
      <h3>Sumar mi lote</h3>
      <FormAlert state={state} />
      <input type="hidden" name="pool_id" value={poolId} />
      <div className="field">
        <label htmlFor="lot_id">¿Cuál de tus lotes?</label>
        <select id="lot_id" name="lot_id" defaultValue={lotes[0]?.id}>
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton pendingText="Sumando…">
        <IconPlus size={24} strokeWidth={2.4} />
        Sumar a esta venta
      </SubmitButton>
    </form>
  );
}

export function SalirForm({ poolId, lotId, label }: { poolId: string; lotId: string; label: string }) {
  const [state, action] = useActionState<FormState, FormData>(salirDeVenta, null);
  const [confirmar, setConfirmar] = useState(false);
  return (
    <form action={action} className="stack">
      <FormAlert state={state} />
      <input type="hidden" name="pool_id" value={poolId} />
      <input type="hidden" name="lot_id" value={lotId} />
      {confirmar ? (
        <>
          <p className="card note">¿Seguro que querés sacar «{label}» de la venta? Vuelve a quedar disponible en Mis lotes.</p>
          <SubmitButton className="btn btn-s" pendingText="Sacando…">
            <IconX size={24} strokeWidth={2.4} />
            Sí, sacar mi lote
          </SubmitButton>
          <button type="button" className="link-btn" onClick={() => setConfirmar(false)}>
            No, dejarlo
          </button>
        </>
      ) : (
        <button type="button" className="link-btn" onClick={() => setConfirmar(true)}>
          Sacar «{label}» de esta venta
        </button>
      )}
    </form>
  );
}

export function OfertarForm({ poolId, cabezas, pesoTotal }: { poolId: string; cabezas: number; pesoTotal: number }) {
  const [state, action] = useActionState<FormState, FormData>(ofertar, null);
  const [precio, setPrecio] = useState("");
  const valor = Number(precio.replace(/\./g, "").replace(",", "."));
  return (
    <form action={action} className="card stack">
      <h3>Hacer una oferta</h3>
      <p className="small">
        La venta llegó a las {fmtInt(cabezas)} cabezas. Ofertá un precio por kg; cada productor acepta o rechaza su parte.
      </p>
      <FormAlert state={state} />
      <input type="hidden" name="pool_id" value={poolId} />
      <div className="field">
        <label htmlFor="price_per_kg">Precio por kg (en pesos)</label>
        <div className="unit">
          <span>$</span>
          <input id="price_per_kg" name="price_per_kg" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
        </div>
      </div>
      <p className="small">
        Peso declarado: ≈ {fmtKg(pesoTotal)}.
        {valor > 0 ? ` Total estimado: ${fmtMoney(valor * pesoTotal)}.` : ""} El peso final se toma en balanza.
      </p>
      <SubmitButton pendingText="Enviando oferta…">
        <IconTag size={24} strokeWidth={2.4} />
        Enviar oferta
      </SubmitButton>
    </form>
  );
}

export function CerrarVenta({ poolId }: { poolId: string }) {
  const [state, action] = useActionState<FormState, FormData>(cerrarVenta, null);
  return (
    <form action={action} className="card stack">
      <h3>Todos aceptaron</h3>
      <p>Como martillero, podés cerrar la venta. Los lotes pasan a vendidos.</p>
      <FormAlert state={state} />
      <input type="hidden" name="pool_id" value={poolId} />
      <SubmitButton pendingText="Cerrando…">
        <IconCheck size={24} strokeWidth={2.6} />
        Cerrar la venta
      </SubmitButton>
    </form>
  );
}
