import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { HeadsProgress, PoolStatusTag, Empty } from "@/components/ui";
import { getPools } from "@/features/pools/queries";
import { negociacionesDelMartillero } from "@/lib/front/derivados";
import { IconArrowRight, IconBell, IconPlus } from "@/components/icons";
import { categoryLabel, fmtMoney } from "@/lib/ui/format";

export const metadata = { title: "Panel del martillero · YvyTape" };

/** Panel del operador / martillero: ventas por etapa, con las que necesitan acción primero. */
export default async function OperadorPage() {
  const perfil = await requireProfile(["operador"]);
  const [{ data }, negociaciones] = await Promise.all([getPools(), negociacionesDelMartillero()]);
  const estado = new Map(negociaciones.map((n) => [n.pool.id, n]));
  const listas = negociaciones.filter((n) => n.lista);
  const pools = data ?? [];
  const orden = ["en_negociacion", "objetivo_alcanzado", "abierto", "cerrado", "cancelado"];
  const lista = [...pools].sort((a, b) => orden.indexOf(a.status) - orden.indexOf(b.status));

  return (
    <AppShell title="Ventas conjuntas" subtitle={`Martillero · ${perfil.full_name}`} perfil={perfil} current="operador">
      {listas.map(({ pool, productores }) => (
        <Link key={pool.id} href={`/ventas-conjuntas/${pool.id}#cerrar`} className="card accent">
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 19 }}>
            <IconBell size={28} />
            Lista para cerrar: aceptaron los {productores} productores
          </span>
          <span>
            «{pool.title}» · {fmtMoney(Number(pool.active_offer?.price_per_kg ?? 0))} por kg de {pool.active_offer?.buyer?.full_name ?? "el comprador"}
          </span>
          <span className="btn" style={{ background: "var(--blanco)", color: "var(--negro)", minHeight: 52 }}>
            Cerrar la venta
            <IconArrowRight size={22} strokeWidth={2.4} />
          </span>
        </Link>
      ))}
      <p className="card note">Las ventas con oferta van primero. Cuando todos los productores aceptan, aparecen arriba como «Lista para cerrar».</p>
      {lista.length === 0 ? <Empty title="Todavía no hay ventas conjuntas" /> : null}
      <div className="lista">
      {lista.map((p) => (
        <Link key={p.id} href={`/ventas-conjuntas/${p.id}`} className="card">
          <h2 style={{ fontSize: 19 }}>{p.title}</h2>
          <span className="small">
            {categoryLabel(p.category)} · {p.zone} · {p.members_count} lotes
          </span>
          <HeadsProgress current={p.current_heads} target={p.target_heads} />
          <div className="row-wrap">
            <PoolStatusTag status={p.status} />
            {estado.get(p.id)?.lista ? (
              <span className="tag tag-ok">Lista para cerrar</span>
            ) : estado.get(p.id) ? (
              <span className="tag tag-declarado">
                Aceptaron {estado.get(p.id)!.aceptaron} de {estado.get(p.id)!.productores}
              </span>
            ) : null}
          </div>
        </Link>
      ))}
      </div>
      <Link href="/ventas-conjuntas/nueva" className="btn btn-s">
        <IconPlus size={24} strokeWidth={2.4} />
        Armar una venta conjunta
      </Link>
    </AppShell>
  );
}
