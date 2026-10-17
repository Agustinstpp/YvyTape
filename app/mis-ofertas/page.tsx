import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { Empty } from "@/components/ui";
import { ofertasDelComprador } from "@/lib/front/derivados";
import { categoryLabel, fmtInt, fmtMoney } from "@/lib/ui/format";

export const metadata = { title: "Mis ofertas · YvyTape" };

const ESTADO = {
  pendiente: { label: "Esperando respuestas", cls: "tag-pendiente" },
  aceptada: { label: "Aceptada", cls: "tag-ok" },
  rechazada: { label: "No aceptada", cls: "tag-no" },
} as const;

export default async function MisOfertasPage() {
  const perfil = await requireProfile(["comprador"]);
  const ventas = await ofertasDelComprador(perfil);

  return (
    <AppShell title="Mis ofertas" perfil={perfil} current="mis-ofertas">
      {ventas.length === 0 ? (
        <Empty title="Todavía no hiciste ofertas">
          <p className="small">Cuando una venta conjunta llega a su objetivo, podés ofertar un precio por kg.</p>
          <Link href="/ofertas">Ver ofertas</Link>
        </Empty>
      ) : (
        ventas.map((v) => {
          const o = v.active_offer!;
          const estado = v.status === "cerrado" ? ESTADO.aceptada : ESTADO[o.status];
          const productores = new Set(v.members.map((m) => m.lot?.producer_id)).size;
          const aceptaron = o.confirmations?.filter((c) => c.accepted).length ?? 0;
          return (
            <Link key={v.id} href={`/ventas-conjuntas/${v.id}`} className="card">
              <h2 style={{ fontSize: 19 }}>{v.title}</h2>
              <p>
                {fmtInt(v.current_heads)} {categoryLabel(v.category).toLowerCase()} · {v.zone}
              </p>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{fmtMoney(Number(o.price_per_kg))} por kg</p>
              <p className="small">
                Aceptaron {aceptaron} de {productores} productores
              </p>
              <span className={`tag ${estado.cls}`} style={{ alignSelf: "flex-start" }}>
                {estado.label}
              </span>
            </Link>
          );
        })
      )}
    </AppShell>
  );
}
