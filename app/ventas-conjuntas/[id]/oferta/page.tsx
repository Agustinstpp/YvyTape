import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { getPoolDetail } from "@/features/pools/queries";
import { miRespuesta } from "@/lib/front/derivados";
import { categoryLabel, fmtInt, fmtKg, fmtMoney } from "@/lib/ui/format";
import { IconBell } from "@/components/icons";
import { ResponderForm } from "./form";

export const metadata = { title: "Responder oferta · YvyTape" };

export default async function ResponderOfertaPage({ params }: { params: Promise<{ id: string }> }) {
  const perfil = await requireProfile(["productor"]);
  const { id } = await params;
  const { data: venta } = await getPoolDetail(id);
  if (!venta) notFound();

  const oferta = venta.active_offer?.status === "pendiente" ? venta.active_offer : null;
  const misLotes = venta.members.filter((m) => m.lot?.producer_id === perfil.id).map((m) => m.lot);
  if (!oferta || misLotes.length === 0 || miRespuesta(venta, perfil) !== null) redirect(`/ventas-conjuntas/${id}`);

  const precio = Number(oferta.price_per_kg);
  const cabezas = misLotes.reduce((a, l) => a + l.head_count, 0);
  const kg = misLotes.reduce((a, l) => a + l.head_count * Number(l.average_weight_kg), 0);
  const productores = new Set(venta.members.map((m) => m.lot?.producer_id)).size;

  return (
    <AppShell title="Oferta para tu parte" back={{ href: `/ventas-conjuntas/${id}`, label: "Volver a la venta" }}>
      <p className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <IconBell size={22} />
        Te llegó un aviso en YvyTape
      </p>
      <h2 style={{ fontSize: 26 }}>¿Aceptás esta oferta?</h2>

      <section className="card highlight">
        <span style={{ fontWeight: 700 }}>Precio ofrecido</span>
        <span style={{ fontSize: 32, lineHeight: 1.1, fontWeight: 800 }}>
          {fmtMoney(precio)} <span style={{ fontSize: 19 }}>por kg</span>
        </span>
        <span>
          De {oferta.buyer?.full_name ?? "un comprador"} para «{venta.title}»
        </span>
      </section>

      <section className="card rows">
        <div className="kv-row"><span>Tu parte</span><span>{fmtInt(cabezas)} {categoryLabel(venta.category).toLowerCase()}</span></div>
        <div className="kv-row"><span>Peso estimado</span><span>≈ {fmtKg(kg)}</span></div>
        <div className="kv-row"><span>Cobro estimado</span><span>≈ {fmtMoney(kg * precio)}</span></div>
        <div className="kv-row"><span>Peso final</span><span>En balanza, al cargar</span></div>
        <div className="kv-row"><span>Comisión, flete y carga</span><span>Los coordina el martillero por Mensajes</span></div>
      </section>

      <p className="card note" style={{ fontSize: 15 }}>
        La venta se cierra solo si aceptan los {productores} productores. Si alguien no acepta, esta oferta se cae y la venta sigue abierta a otras ofertas.
      </p>

      <ResponderForm poolId={id} offerId={oferta.id} />
      <p className="small" style={{ textAlign: "center" }}>
        ¿Dudas antes de responder?{" "}
        <Link href={`/mensajes/nueva?venta=${id}&asunto=${encodeURIComponent(`Consulta sobre ${venta.title}`)}`}>Escribí al grupo en Mensajes</Link>.
      </p>
    </AppShell>
  );
}
