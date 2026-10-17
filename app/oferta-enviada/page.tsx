import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { getPoolDetail } from "@/features/pools/queries";
import { categoryLabel, fmtInt, fmtMoney } from "@/lib/ui/format";
import { IconChat, IconCheck, IconClock, IconTag } from "@/components/icons";

export const metadata = { title: "Oferta enviada · YvyTape" };

export default async function OfertaEnviadaPage({ searchParams }: { searchParams: Promise<{ venta?: string }> }) {
  const perfil = await requireProfile(["comprador"]);
  const { venta: ventaId } = await searchParams;
  const { data: venta } = ventaId ? await getPoolDetail(ventaId) : { data: null };
  const oferta = venta?.active_offer;
  const productores = venta ? new Set(venta.members.map((m) => m.lot?.producer_id)).size : 0;
  const respondieron = oferta?.confirmations?.length ?? 0;

  return (
    <AppShell title="Oferta enviada" perfil={perfil} current="mis-ofertas">
      <div style={{ width: 96, height: 96, borderRadius: 999, background: "var(--exito-fondo)", color: "var(--exito)", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
        <IconCheck size={56} strokeWidth={2.6} />
      </div>
      <h2 style={{ fontSize: 27, textAlign: "center" }}>Oferta enviada</h2>
      <p style={{ fontSize: 17, textAlign: "center" }}>Cada productor acepta o rechaza su parte. Te avisamos en YvyTape cuando respondan.</p>
      {venta && oferta ? (
        <>
          <section className="card rows">
            <div className="kv-row"><span>Venta</span><span>{venta.title}</span></div>
            <div className="kv-row"><span>Tu oferta</span><span>{fmtMoney(Number(oferta.price_per_kg))} por kg</span></div>
            <div className="kv-row"><span>Cantidad</span><span>{fmtInt(venta.current_heads)} {categoryLabel(venta.category).toLowerCase()}</span></div>
          </section>
          <section className="card">
            <strong style={{ fontSize: 19 }}>
              {respondieron} de {productores} productores respondieron
            </strong>
            <div className="bar" role="img" aria-label={`${respondieron} de ${productores} productores respondieron`}>
              <div style={{ width: `${productores ? (respondieron / productores) * 100 : 0}%` }} />
            </div>
            <span className="tag tag-pendiente" style={{ alignSelf: "flex-start" }}>
              <IconClock size={18} strokeWidth={2.6} />
              Esperando respuestas
            </span>
          </section>
        </>
      ) : null}
      <Link href="/mis-ofertas" className="btn btn-p">
        <IconTag size={24} strokeWidth={2.4} />
        Ver mis ofertas
      </Link>
      {venta ? (
        <Link href={`/mensajes/nueva?venta=${venta.id}&asunto=${encodeURIComponent(`Consulta sobre ${venta.title}`)}`} className="btn btn-s">
          <IconChat size={24} strokeWidth={2.4} />
          Escribir al grupo de la venta
        </Link>
      ) : null}
    </AppShell>
  );
}
