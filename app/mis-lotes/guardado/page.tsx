import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { getMyLots } from "@/features/lots/queries";
import { getPools } from "@/features/pools/queries";
import { IconCheck, IconGroup, IconHome } from "@/components/icons";
import { categoryLabel, fmtInt, fmtKg } from "@/lib/ui/format";
import { lotesQueEntran } from "@/lib/front/derivados";

export const metadata = { title: "Lote guardado · YvyTape" };

export default async function LoteGuardadoPage({ searchParams }: { searchParams: Promise<{ lote?: string }> }) {
  await requireProfile(["productor"]);
  const { lote: loteId } = await searchParams;
  const [{ data: lotes }, { data: pools }] = await Promise.all([getMyLots(), getPools({ status: "abierto" })]);
  const lote = (lotes ?? []).find((l) => l.id === loteId);
  const cerca = lote ? (pools ?? []).filter((p) => lotesQueEntran(p, [lote]).length > 0) : [];

  return (
    <div className="app">
      <main className="page" style={{ paddingTop: 40 }}>
        <div style={{ width: 96, height: 96, borderRadius: 999, background: "var(--exito-fondo)", color: "var(--exito)", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
          <IconCheck size={56} strokeWidth={2.6} />
        </div>
        <h1 style={{ textAlign: "center", fontSize: 27 }}>Lote guardado</h1>
        <p style={{ textAlign: "center", fontSize: 17 }}>
          Ya está en <strong>Mis lotes</strong> y los compradores lo pueden ver.
        </p>
        {lote ? (
          <section className="card rows">
            <div className="kv-row"><span>Categoría</span><span>{categoryLabel(lote.category)} · {lote.breed}</span></div>
            <div className="kv-row"><span>Cantidad</span><span>{fmtInt(lote.head_count)} cabezas</span></div>
            <div className="kv-row"><span>Peso promedio</span><span>{fmtKg(Number(lote.average_weight_kg))} (declarado)</span></div>
            <div className="kv-row"><span>Localidad</span><span>{lote.farm?.zone ?? "—"}</span></div>
          </section>
        ) : null}
        {cerca.length > 0 ? (
          <section className="card highlight">
            <h2 style={{ fontSize: 19 }}>¿Y ahora?</h2>
            <p>
              Tu lote entra en {cerca.length === 1 ? "esta venta conjunta" : "estas ventas conjuntas"} de {categoryLabel(lote!.category).toLowerCase()} cerca tuyo. Sumate para llegar a un comprador más grande.
            </p>
            {cerca.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/ventas-conjuntas/${p.id}#sumar`} className="btn" style={{ background: "var(--blanco)", color: "var(--negro)" }}>
                Sumarlo a «{p.title}» · faltan {fmtInt(p.target_heads - p.current_heads)}
              </Link>
            ))}
          </section>
        ) : null}
        <div className="spacer" />
        <Link href={lote ? `/ventas-conjuntas?categoria=${lote.category}` : "/ventas-conjuntas"} className="btn btn-p">
          <IconGroup size={24} strokeWidth={2.4} />
          Ver ventas conjuntas
        </Link>
        <Link href="/inicio" className="btn btn-s">
          <IconHome size={24} strokeWidth={2.4} />
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
