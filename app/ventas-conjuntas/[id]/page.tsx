import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { areZonesCompatible, mismaZona } from "@/lib/front/zonas";
import { AppShell } from "@/components/app-shell";
import { AnswerTag, HeadsProgress, PoolStatusTag } from "@/components/ui";
import { getPoolDetail } from "@/features/pools/queries";
import { getMyLots } from "@/features/lots/queries";
import { miRespuesta } from "@/lib/front/derivados";
import { categoryLabel, fmtInt, fmtKg, fmtMoney } from "@/lib/ui/format";
import { IconArrowRight, IconChat, IconPin, IconTruck } from "@/components/icons";
import { CerrarVenta, OfertarForm, SalirForm, SumarForm } from "./forms";

export const metadata = { title: "Venta conjunta · YvyTape" };

export default async function VentaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ respuesta?: string }>;
}) {
  // Sin sesión se ve en modo lectura; para sumarse, ofertar o consultar hay que ingresar.
  const perfil = await getSessionProfile();
  const { id } = await params;
  const { respuesta } = await searchParams;
  const { data: venta } = await getPoolDetail(id);
  if (!venta) notFound();

  const esProductor = perfil?.role === "productor";
  const esComprador = perfil?.role === "comprador";
  const esOperador = perfil?.role === "operador";

  const misLotesEnVenta = venta.members.filter((m) => m.lot?.producer_id === perfil?.id).map((m) => m.lot);
  const oferta = venta.active_offer && venta.active_offer.status === "pendiente" ? venta.active_offer : null;
  const ultimaOferta = venta.active_offer ?? null;
  const productores = Array.from(new Set(venta.members.map((m) => m.lot?.producer_id).filter(Boolean)));
  const aceptaron = oferta?.confirmations?.filter((c) => c.accepted).length ?? 0;
  const yoRespondi = perfil ? miRespuesta(venta, perfil) : null;
  const pesoTotal = venta.members.reduce((a, m) => a + (m.lot?.head_count ?? 0) * Number(m.lot?.average_weight_kg ?? 0), 0);

  // Lotes propios que se pueden sumar: disponibles, misma categoría y zona (o zona compatible)
  let sumables: { id: string; label: string }[] = [];
  if (esProductor && venta.status === "abierto") {
    const { data: lotes } = await getMyLots();
    sumables = (lotes ?? [])
      .filter(
        (l) =>
          l.status === "disponible" &&
          l.category === venta.category &&
          areZonesCompatible(l.farm?.zone, venta.zone) &&
          venta.current_heads + l.head_count <= venta.target_heads
      )
      .map((l) => ({ id: l.id, label: `${l.title} · ${fmtInt(l.head_count)} cabezas` }));
  }

  return (
    <AppShell
      title="Venta conjunta"
      back={{ href: esComprador || !perfil ? "/ofertas" : esOperador ? "/operador" : "/ventas-conjuntas", label: "Volver" }}
      perfil={perfil}
      current={esComprador || !perfil ? "ofertas" : esOperador ? "operador" : "ventas"}
    >
      {respuesta ? (
        <p className="alert alert-ok" role="status">
          {respuesta === "si"
            ? "Aceptaste tu parte. Te avisamos en YvyTape cuando respondan todos."
            : "Registramos que no aceptás. La oferta se cae y la venta sigue abierta a otras ofertas."}
        </p>
      ) : null}

      <div>
        <h2 style={{ fontSize: 24 }}>{venta.title}</h2>
        <p className="muted">
          {categoryLabel(venta.category)} · {venta.zone}
        </p>
      </div>

      <section className="card">
        <p style={{ fontWeight: 700, color: "var(--texto-apoyo)" }}>Objetivo: {fmtInt(venta.target_heads)} cabezas</p>
        <HeadsProgress current={venta.current_heads} target={venta.target_heads} big />
        <PoolStatusTag status={venta.status} />
      </section>

      {esProductor && venta.status === "abierto" ? (
        sumables.length > 0 ? (
          <div id="sumar">
            <SumarForm poolId={venta.id} lotes={sumables} />
          </div>
        ) : misLotesEnVenta.length === 0 ? (
          <p className="card note">
            Para sumarte necesitás un lote disponible de {categoryLabel(venta.category).toLowerCase()} en {venta.zone} o zona cercana compatible que entre en lo que falta.{" "}
            <Link href="/mis-lotes/nuevo">Registrar un lote</Link>
          </p>
        ) : null
      ) : null}

      {oferta ? (
        <section className="card highlight">
          <h3 style={{ fontSize: 19 }}>Oferta recibida</h3>
          <p style={{ fontSize: 27, lineHeight: 1.1, fontWeight: 800 }}>
            {fmtMoney(Number(oferta.price_per_kg))} <span style={{ fontSize: 17 }}>por kg</span>
          </p>
          <p>
            De {oferta.buyer?.full_name ?? "un comprador"}. Aceptaron {aceptaron} de {productores.length} productores.
          </p>
          {esProductor && misLotesEnVenta.length > 0 && yoRespondi === null ? (
            <Link href={`/ventas-conjuntas/${venta.id}/oferta`} className="btn" style={{ background: "var(--blanco)", color: "var(--negro)" }}>
              Ver la oferta y responder
              <IconArrowRight size={22} strokeWidth={2.4} />
            </Link>
          ) : null}
        </section>
      ) : null}

      {venta.status === "cerrado" && ultimaOferta ? (
        <p className="alert alert-ok">
          Venta cerrada a {fmtMoney(Number(ultimaOferta.price_per_kg))} por kg con {ultimaOferta.buyer?.full_name ?? "el comprador"}.
        </p>
      ) : null}

      <section className="card rows">
        <h3 style={{ marginTop: 12 }}>{oferta ? "Participantes y respuesta a la oferta" : "Lotes en la venta"}</h3>
        {venta.members.length === 0 ? <p className="small" style={{ padding: "8px 0" }}>Todavía no hay lotes. ¡Sumá el primero!</p> : null}
        {venta.members.map((m) => {
          const mio = !!perfil && m.lot?.producer_id === perfil.id;
          const conf = oferta?.confirmations?.find((c) => c.producer_id === m.lot?.producer_id);
          return (
            <div key={m.id} className="kv-row" style={{ alignItems: "center", ...(mio ? { background: "#fff6e0", margin: "0 -18px", padding: "11px 18px" } : {}) }}>
              <span style={{ color: "var(--negro)" }}>
                <strong>{m.lot?.farm?.name ?? "Establecimiento"}</strong>
                {mio ? <span className="tag" style={{ background: "var(--marron)", color: "var(--blanco)", marginLeft: 6 }}>Vos</span> : null}
                <br />
                <span className="small">
                  {m.lot?.farm?.zone} · {fmtInt(m.lot?.head_count ?? 0)} {categoryLabel(venta.category).toLowerCase()} · {fmtKg(Number(m.lot?.average_weight_kg ?? 0))} prom.
                </span>
              </span>
              {oferta ? <AnswerTag accepted={conf ? conf.accepted : null} /> : <strong>{fmtInt(m.lot?.head_count ?? 0)}</strong>}
            </div>
          );
        })}
        <div className="kv-row">
          <strong>Total</strong>
          <strong>
            {fmtInt(venta.current_heads)} cabezas · ≈ {fmtKg(pesoTotal)}
          </strong>
        </div>
      </section>
      <p className="small">Solo mostramos el establecimiento y la localidad. Los datos personales no se comparten.</p>


      {(esProductor || esOperador) && venta.status === "abierto" ? (
        <Link href={`/ventas-conjuntas/${venta.id}/completar`} className="btn btn-s">
          <IconPin size={22} strokeWidth={2.4} />
          Completar la venta: ver productores cerca
        </Link>
      ) : null}

      {esProductor && misLotesEnVenta.length > 0 && ["abierto", "objetivo_alcanzado"].includes(venta.status)
        ? misLotesEnVenta.map((l) => <SalirForm key={l.id} poolId={venta.id} lotId={l.id} label={l.title} />)
        : null}

      {esComprador && venta.status === "objetivo_alcanzado" ? (
        <OfertarForm poolId={venta.id} cabezas={venta.current_heads} pesoTotal={pesoTotal} />
      ) : null}
      {esComprador && venta.status === "abierto" ? (
        <p className="card note">Cuando la venta llegue a las {fmtInt(venta.target_heads)} cabezas vas a poder ofertar.</p>
      ) : null}

      {esOperador && oferta && aceptaron === productores.length && productores.length > 0 ? (
        <CerrarVenta poolId={venta.id} />
      ) : null}

      <Link href={`/flete?cabezas=${venta.current_heads}&venta=${venta.id}`} className="link-btn" style={{ justifyContent: "center" }}>
        <IconTruck size={22} />
        Calcular flete estimado para esta venta
      </Link>
      {!perfil ? (
        <Link href="/ingresar" className="btn btn-p">
          Ingresá para ofertar o sumar tu lote
        </Link>
      ) : null}
      <Link
        href={!perfil ? "/ingresar" : `/mensajes/nueva?venta=${venta.id}&asunto=${encodeURIComponent(`Consulta sobre ${venta.title}`)}`}
        className="btn btn-s"
      >
        <IconChat size={24} strokeWidth={2.4} />
        {esComprador || !perfil ? "Enviar una consulta" : "Tengo una duda: escribir al grupo"}
      </Link>
      <p className="small" style={{ textAlign: "center" }}>
        Las consultas llegan al martillero y a los productores de esta venta, dentro de YvyTape.
      </p>
    </AppShell>
  );
}
