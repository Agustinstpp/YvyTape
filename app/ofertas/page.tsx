import Link from "next/link";
import { getSessionProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { HeadsProgress, PoolStatusTag, SaleSeal, Empty } from "@/components/ui";
import { getAvailableLots } from "@/features/lots/queries";
import { getPools } from "@/features/pools/queries";
import { IconPin } from "@/components/icons";
import { CATEGORIES, categoryLabel, fmtInt, fmtKg } from "@/lib/ui/format";
import type { LivestockCategory } from "@/lib/types/domain";

export const metadata = { title: "Ofertas · YvyTape" };

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<{ zona?: string; categoria?: string }>;
}) {
  const perfil = await getSessionProfile();
  const { zona, categoria } = await searchParams;
  const cat = CATEGORIES.includes(categoria as LivestockCategory) ? (categoria as LivestockCategory) : undefined;

  const [{ data: lotes }, { data: pools }] = await Promise.all([
    getAvailableLots({ category: cat, zone: zona || undefined }),
    getPools({ category: cat, zone: zona || undefined }),
  ]);
  const ventas = (pools ?? []).filter((p) => ["abierto", "objetivo_alcanzado", "en_negociacion"].includes(p.status));
  const individuales = lotes ?? [];
  const zonas = Array.from(new Set([...(pools ?? []).map((p) => p.zone), ...individuales.map((l) => l.farm?.zone ?? "")].filter(Boolean))).sort();
  const total = ventas.length + individuales.length;

  return (
    <AppShell
      title="Ofertas"
      subtitle="Hacienda de Corrientes para compradores"
      perfil={perfil}
      current="ofertas"
      back={perfil ? undefined : { href: "/", label: "Volver al inicio" }}
    >
      <form className="stack" method="get">
        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="zona">Localidad</label>
            <select id="zona" name="zona" defaultValue={zona ?? ""}>
              <option value="">Todas</option>
              {zonas.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="categoria">Categoría</label>
            <select id="categoria" name="categoria" defaultValue={cat ?? ""}>
              <option value="">Todas</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-s">Filtrar</button>
      </form>

      <Link href="/mapa" className="btn btn-s">
        <IconPin size={24} strokeWidth={2.4} />
        Ver en el mapa
      </Link>

      <p style={{ fontWeight: 700 }}>
        {total} {total === 1 ? "oferta" : "ofertas"}
      </p>

      {total === 0 ? (
        <Empty title="No hay ofertas con esos filtros">
          <Link href="/ofertas">Ver todas</Link>
        </Empty>
      ) : null}

      {ventas.map((p) => (
        <Link key={p.id} href={`/ventas-conjuntas/${p.id}`} className="card">
          <SaleSeal kind="conjunta" producers={p.members_count} />
          <h2 style={{ fontSize: 22 }}>{p.title}</h2>
          <span className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <IconPin size={20} />
            {categoryLabel(p.category)} · {p.zone}
          </span>
          <HeadsProgress current={p.current_heads} target={p.target_heads} />
          <PoolStatusTag status={p.status} />
        </Link>
      ))}

      {individuales.map((l) => (
        <Link key={l.id} href={`/ofertas/lote/${l.id}`} className="card">
          <SaleSeal kind="individual" />
          <h2 style={{ fontSize: 22 }}>
            {categoryLabel(l.category)} · {l.breed}
          </h2>
          <p style={{ fontSize: 24, fontWeight: 800 }}>
            {fmtInt(l.head_count)} {categoryLabel(l.category, l.head_count !== 1).toLowerCase()}
          </p>
          <span className="small">{fmtKg(Number(l.average_weight_kg))} prom. (declarado)</span>
          <span className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <IconPin size={20} />
            {l.farm?.zone ?? ""}
          </span>
        </Link>
      ))}

      {!perfil ? (
        <Link href="/registrarse?rol=comprador" className="btn btn-p">
          Crear cuenta de comprador para ofertar
        </Link>
      ) : null}
    </AppShell>
  );
}
