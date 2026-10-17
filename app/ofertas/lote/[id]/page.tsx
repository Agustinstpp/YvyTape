import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { SaleSeal } from "@/components/ui";
import { getAvailableLots } from "@/features/lots/queries";
import { categoryLabel, fmtInt, fmtKg } from "@/lib/ui/format";
import { IconChat, IconTruck } from "@/components/icons";

export const metadata = { title: "Lote · YvyTape" };

export default async function LotePage({ params }: { params: Promise<{ id: string }> }) {
  const perfil = await getSessionProfile();
  const { id } = await params;
  // El backend no tiene una consulta por id: se busca entre los lotes disponibles.
  const { data: lotes } = await getAvailableLots();
  const lote = (lotes ?? []).find((l) => l.id === id);
  if (!lote) notFound();

  const esMio = perfil?.id === lote.producer_id;

  return (
    <AppShell title="Detalle del lote" back={{ href: "/ofertas", label: "Volver a ofertas" }} perfil={perfil} current="ofertas">
      <SaleSeal kind="individual" />
      <h2 style={{ fontSize: 30 }}>{lote.title}</h2>

      <div className="stats">
        <div className="stat"><span>Categoría</span><b style={{ fontSize: 26 }}>{categoryLabel(lote.category)}</b></div>
        <div className="stat"><span>Cantidad</span><b style={{ fontSize: 26 }}>{fmtInt(lote.head_count)}</b></div>
        <div className="stat">
          <span>Peso promedio</span>
          <b style={{ fontSize: 26 }}>{fmtKg(Number(lote.average_weight_kg))}</b>
          <span className="tag tag-declarado" style={{ alignSelf: "flex-start" }}>Declarado</span>
        </div>
        <div className="stat"><span>Raza</span><b style={{ fontSize: 26 }}>{lote.breed}</b></div>
      </div>

      <section className="card rows">
        <div className="kv-row"><span>Establecimiento</span><span>{lote.farm?.name ?? "—"}</span></div>
        <div className="kv-row"><span>Localidad</span><span>{lote.farm?.zone ?? "—"}</span></div>
        <div className="kv-row"><span>Caravana electrónica</span><span>{lote.electronic_tag_reference ? "Informada" : "No informada"}</span></div>
        <div className="kv-row">
          <span>Verificación</span>
          <span className={`tag ${lote.verification_status === "revisado" ? "tag-ok" : "tag-declarado"}`}>
            {lote.verification_status === "revisado" ? "Revisado" : lote.verification_status === "pendiente" ? "En revisión" : "Declarado"}
          </span>
        </div>
        <p className="small" style={{ padding: "8px 0 12px" }}>
          <strong>Declarado:</strong> lo informó el productor, sin revisar. <strong>Revisado:</strong> solo cuando el equipo de YvyTape vio la documentación. No reemplaza controles oficiales.
        </p>
      </section>

      <p className="card note">
        Para comprar en volumen, este lote puede sumarse a una venta conjunta de su zona. Si te interesa, consultá y el martillero lo coordina.
      </p>

      {!esMio ? (
        <Link
          href={perfil ? `/mensajes/nueva?lote=${lote.id}&asunto=${encodeURIComponent(`Consulta sobre ${lote.title}`)}` : "/ingresar"}
          className="btn btn-p"
        >
          <IconChat size={24} strokeWidth={2.4} />
          Enviar una consulta
        </Link>
      ) : null}
      <Link href={`/flete?cabezas=${lote.head_count}`} className="link-btn" style={{ justifyContent: "center" }}>
        <IconTruck size={22} />
        Calcular flete estimado
      </Link>
    </AppShell>
  );
}
