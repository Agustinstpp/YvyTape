import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { HeadsProgress, PoolStatusTag, Empty } from "@/components/ui";
import { getPools } from "@/features/pools/queries";
import { IconLogout, IconPlus } from "@/components/icons";
import { categoryLabel } from "@/lib/ui/format";
import { salir } from "@/app/acciones";

export const metadata = { title: "Panel del martillero · YvyTape" };

/** Panel del operador / martillero: ventas por etapa, con las que necesitan acción primero. */
export default async function OperadorPage() {
  const perfil = await requireProfile(["operador"]);
  const { data } = await getPools();
  const pools = data ?? [];
  const orden = ["en_negociacion", "objetivo_alcanzado", "abierto", "cerrado", "cancelado"];
  const lista = [...pools].sort((a, b) => orden.indexOf(a.status) - orden.indexOf(b.status));

  return (
    <AppShell title="Ventas conjuntas" subtitle={`Martillero · ${perfil.full_name}`} perfil={perfil} current="operador">
      <p className="card note">Las ventas con oferta van primero. Cuando todos los productores aceptan, podés cerrarlas desde el detalle.</p>
      {lista.length === 0 ? <Empty title="Todavía no hay ventas conjuntas" /> : null}
      <div className="lista">
      {lista.map((p) => (
        <Link key={p.id} href={`/ventas-conjuntas/${p.id}`} className="card">
          <h2 style={{ fontSize: 19 }}>{p.title}</h2>
          <span className="small">
            {categoryLabel(p.category)} · {p.zone} · {p.members_count} lotes
          </span>
          <HeadsProgress current={p.current_heads} target={p.target_heads} />
          <PoolStatusTag status={p.status} />
        </Link>
      ))}
      </div>
      <Link href="/ventas-conjuntas/nueva" className="btn btn-s">
        <IconPlus size={24} strokeWidth={2.4} />
        Armar una venta conjunta
      </Link>
      <form action={salir}>
        <button type="submit" className="link-btn">
          <IconLogout size={22} />
          Salir de YvyTape
        </button>
      </form>
    </AppShell>
  );
}
