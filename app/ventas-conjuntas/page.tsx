import Link from "next/link";
import { mismaZona } from "@/lib/front/zonas";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { HeadsProgress, PoolStatusTag, Empty } from "@/components/ui";
import { ventasDelProductor } from "@/lib/front/derivados";
import { IconPin, IconPlus } from "@/components/icons";
import { CATEGORIES, categoryLabel } from "@/lib/ui/format";
import type { LivestockCategory, PoolSummary } from "@/lib/types/domain";

export const metadata = { title: "Ventas conjuntas · YvyTape" };

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; categoria?: string }>;
}) {
  const perfil = await requireProfile(["productor"]);
  const { ver, categoria } = await searchParams;
  const { ventas, todas, lotes } = await ventasDelProductor(perfil);
  const participo = new Set(ventas.map((v) => v.pool.id));
  const cat = CATEGORIES.includes(categoria as LivestockCategory) ? (categoria as LivestockCategory) : null;

  const misZonas = lotes.map((l) => l.farm?.zone).filter(Boolean) as string[];
  let lista: PoolSummary[] =
    ver === "mias" ? todas.filter((p) => participo.has(p.id)) : todas.filter((p) => p.status !== "cancelado");
  if (cat) lista = lista.filter((p) => p.category === cat);
  if (ver !== "mias" && ver !== "todas" && misZonas.length > 0) {
    const cerca = lista.filter((p) => misZonas.some((z) => mismaZona(z, p.zone)) || participo.has(p.id));
    if (cerca.length) lista = cerca;
  }

  const filtro = (key: string, label: string) => {
    const activo = (ver ?? "cerca") === key;
    return (
      <Link
        href={`/ventas-conjuntas?ver=${key}${cat ? `&categoria=${cat}` : ""}`}
        className={`btn btn-inline ${activo ? "btn-y" : "btn-s"}`}
        aria-current={activo ? "true" : undefined}
      >
        {label}
      </Link>
    );
  };

  return (
    <AppShell title="Ventas conjuntas" subtitle="Se arman entre productores de la zona" perfil={perfil} current="ventas">
      <div className="row-wrap">
        {filtro("cerca", "Cerca mío")}
        {filtro("mias", "Donde participo")}
        {filtro("todas", "Todas")}
      </div>
      {cat ? (
        <p className="small">
          Mostrando {categoryLabel(cat).toLowerCase()}. <Link href={`/ventas-conjuntas?ver=${ver ?? "cerca"}`}>Ver todas las categorías</Link>
        </p>
      ) : null}

      {lista.length === 0 ? (
        <Empty title="No hay ventas conjuntas para mostrar">
          <p className="small">Podés armar una nueva y te avisamos cuando otros productores se sumen.</p>
        </Empty>
      ) : (
        lista.map((p) => (
          <Link key={p.id} href={`/ventas-conjuntas/${p.id}`} className="card">
            <h2 style={{ fontSize: 19 }}>{p.title}</h2>
            <span className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <IconPin size={20} />
              {categoryLabel(p.category)} · {p.zone} · {p.members_count} {p.members_count === 1 ? "lote" : "lotes"}
            </span>
            <HeadsProgress current={p.current_heads} target={p.target_heads} />
            <div className="row-wrap">
              <PoolStatusTag status={p.status} />
              {participo.has(p.id) ? <span className="tag" style={{ background: "var(--naranja)" }}>Participás</span> : null}
            </div>
          </Link>
        ))
      )}

      <Link href="/mapa" className="btn btn-s">
        <IconPin size={24} strokeWidth={2.4} />
        Ver productores y ventas en el mapa
      </Link>
      <Link href="/ventas-conjuntas/nueva" className="btn btn-s">
        <IconPlus size={24} strokeWidth={2.4} />
        Armar una venta conjunta nueva
      </Link>
    </AppShell>
  );
}
