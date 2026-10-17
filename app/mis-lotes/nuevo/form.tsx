"use client";

// TODO(backend): campos del mockup que no existen en la base: rinde estimado, precio pretendido, fotos,
//   documentación de tránsito/sanidad. Tampoco hay destino de la venta (invernada o faena) para el ciclo cría → invernada → faena.
import { useActionState, useState } from "react";
import { registrarLote } from "@/app/acciones";
import { FieldError, FormAlert, SubmitButton, ZonasDatalist, type FormState } from "@/components/form-parts";
import { IconArrowLeft, IconArrowRight, IconCheck, IconInfo } from "@/components/icons";
import { CATEGORIES, categoryLabel } from "@/lib/ui/format";

type Farm = { id: string; name: string; zone: string };

const PASOS = ["Establecimiento", "Categoría y raza", "Cantidad y peso", "Revisar"] as const;

/**
 * Formulario por pasos cortos, como en el mockup. Todos los campos viven en el
 * mismo <form>: los pasos solo muestran u ocultan partes, así no se pierde nada.
 */
export function LoteForm({ farms, zonaPerfil }: { farms: Farm[]; zonaPerfil: string }) {
  const [state, action] = useActionState<FormState, FormData>(registrarLote, null);
  const [paso, setPaso] = useState(0);
  const [farmId, setFarmId] = useState(farms[0]?.id ?? "nuevo");
  const [cat, setCat] = useState("");
  const fe = state?.fieldErrors ?? {};

  const ver = (i: number) => ({ display: paso === i || paso === 3 ? "flex" : "none" }) as const;
  const enRevision = paso === 3;

  return (
    <form action={action} className="stack" style={{ gap: 18 }} noValidate>
      <div className="stack" style={{ gap: 8 }}>
        <p style={{ fontWeight: 700, color: "var(--marron)" }}>
          Paso {paso + 1} de {PASOS.length}: {PASOS[paso]}
        </p>
        <div style={{ display: "flex", gap: 6 }} aria-hidden="true">
          {PASOS.map((p, i) => (
            <span
              key={p}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 999,
                background: i < paso ? "var(--marron)" : i === paso ? "var(--naranja)" : "#e6d6bd",
              }}
            />
          ))}
        </div>
      </div>

      <FormAlert state={state} />

      {/* Paso 1: establecimiento */}
      <section className="stack" style={{ ...ver(0), gap: 14 }}>
        {enRevision ? <h2 style={{ fontSize: 19 }}>Establecimiento</h2> : <h2 style={{ fontSize: 23 }}>¿En qué campo están los animales?</h2>}
        {farms.length > 0 ? (
          <div className="field">
            <label htmlFor="farm_id">Establecimiento</label>
            <select id="farm_id" name="farm_id" value={farmId} onChange={(e) => setFarmId(e.target.value)}>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} · {f.zone}
                </option>
              ))}
              <option value="nuevo">Otro establecimiento…</option>
            </select>
          </div>
        ) : (
          <input type="hidden" name="farm_id" value="nuevo" />
        )}
        {farmId === "nuevo" ? (
          <>
            <div className="field">
              <label htmlFor="farm_name">Nombre del establecimiento</label>
              <input id="farm_name" name="farm_name" aria-invalid={!!fe.farm_name} aria-describedby="e-farm_name" />
              <FieldError id="e-farm_name" message={fe.farm_name} />
            </div>
            <div className="field">
              <label htmlFor="farm_zone">Localidad</label>
              <ZonasDatalist />
              <input id="farm_zone" name="farm_zone" list="zonas" autoComplete="off" defaultValue={zonaPerfil} aria-invalid={!!fe.farm_zone} aria-describedby="h-farm_zone e-farm_zone" />
              <span id="h-farm_zone" className="help">Las ventas conjuntas se arman entre lotes de la misma zona.</span>
              <FieldError id="e-farm_zone" message={fe.farm_zone} />
            </div>
          </>
        ) : null}
      </section>

      {/* Paso 2: categoría y raza */}
      <section className="stack" style={{ ...ver(1), gap: 14 }}>
        {enRevision ? <h2 style={{ fontSize: 19 }}>Categoría y raza</h2> : <h2 style={{ fontSize: 23 }}>¿Qué animales son?</h2>}
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }} aria-describedby="e-category">
          <legend className="label" style={{ marginBottom: 6 }}>Categoría</legend>
          <div className="choices">
            {CATEGORIES.map((c) => (
              <label key={c} className="choice">
                <input type="radio" name="category" value={c} checked={cat === c} onChange={() => setCat(c)} />
                <span>{categoryLabel(c)}</span>
              </label>
            ))}
          </div>
          <FieldError id="e-category" message={fe.category} />
        </fieldset>
        <div className="field">
          <label htmlFor="breed">Raza</label>
          <input id="breed" name="breed" placeholder="Por ejemplo: Braford" aria-invalid={!!fe.breed} aria-describedby="e-breed" />
          <FieldError id="e-breed" message={fe.breed} />
        </div>
      </section>

      {/* Paso 3: cantidad y peso */}
      <section className="stack" style={{ ...ver(2), gap: 14 }}>
        {enRevision ? <h2 style={{ fontSize: 19 }}>Cantidad y peso</h2> : <h2 style={{ fontSize: 23 }}>¿Cuántos animales y cuánto pesan?</h2>}
        <div className="field">
          <label htmlFor="head_count">Cantidad de cabezas</label>
          <input id="head_count" name="head_count" inputMode="numeric" aria-invalid={!!fe.head_count} aria-describedby="e-head_count" />
          <FieldError id="e-head_count" message={fe.head_count} />
        </div>
        <div className="field">
          <label htmlFor="average_weight_kg">Peso promedio estimado</label>
          <div className="unit">
            <input id="average_weight_kg" name="average_weight_kg" inputMode="decimal" aria-invalid={!!fe.average_weight_kg} aria-describedby="h-peso e-average_weight_kg" />
            <span>kg</span>
          </div>
          <span id="h-peso" className="help">Por animal. Un cálculo a ojo está bien; el comprador lo ve como «declarado».</span>
          <FieldError id="e-average_weight_kg" message={fe.average_weight_kg} />
        </div>
        <div className="field">
          <label htmlFor="electronic_tag_reference">
            Caravana electrónica <span style={{ fontWeight: 400 }}>(opcional)</span>
          </label>
          <input id="electronic_tag_reference" name="electronic_tag_reference" aria-describedby="h-tag" />
          <span id="h-tag" className="help">Si la tenés, ayuda a que el comprador confíe en el lote.</span>
        </div>
        <div className="field">
          <label htmlFor="title">
            Nombre del lote <span style={{ fontWeight: 400 }}>(opcional)</span>
          </label>
          <input id="title" name="title" placeholder="Por ejemplo: Terneros de invierno" />
        </div>
      </section>

      <p className="alert alert-info" style={{ display: enRevision ? "flex" : "none" }}>
        <IconInfo size={24} />
        Revisá los datos. Si algo está mal, corregilo acá mismo antes de guardar.
      </p>

      <div className="stack">
        {paso < 3 ? (
          <button type="button" className="btn btn-p" onClick={() => setPaso((p) => p + 1)}>
            {paso === 2 ? "Revisar" : `Siguiente: ${PASOS[paso + 1].toLowerCase()}`}
            <IconArrowRight size={24} strokeWidth={2.4} />
          </button>
        ) : (
          <SubmitButton pendingText="Guardando lote…">
            <IconCheck size={24} strokeWidth={2.6} />
            Guardar lote
          </SubmitButton>
        )}
        {paso > 0 ? (
          <button type="button" className="btn btn-s" onClick={() => setPaso((p) => p - 1)}>
            <IconArrowLeft size={24} strokeWidth={2.4} />
            Volver
          </button>
        ) : null}
      </div>
    </form>
  );
}
