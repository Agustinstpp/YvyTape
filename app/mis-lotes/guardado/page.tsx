import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { getMyLots } from "@/features/lots/queries";
import { getPools } from "@/features/pools/queries";
import { IconCheck, IconGroup, IconHome } from "@/components/icons";
import { categoryLabel, fmtInt, fmtKg } from "@/lib/ui/format";

export const metadata = { title: "Lote guardado · YvyTape" };

export default async function LoteGuardadoPage({ searchParams }: { searchParams: Promise<{ lote?: string }> }) {
  await requireProfile(["productor"]);
  const { lote: loteId } = await searchParams;
  const [{ data: lotes }, { data: pools }] = await Promise.all([getMyLots(), getPools({ status: "abierto" })]);
  const lote = (lotes ?? []).find((l) => l.id === loteId);
  const cerca = lote
    ? (pools ?? []).filter((p) => p.category === lote.category && p.zone.toLowerCase() === (lote.farm?.zone ?? "").toLowerCase())
    : [];

  return (
    <div className="app">
      <main className="page" style={{ paddingTop: 40 }}>
        <div style={{ width: 96, height: 96, borderRadius: 999, background: "var(--exito-fondo)", color: "var(--exito)", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
          <IconCheck size={56} strokeWidth={2.6} />
        </div>
        <h1 style={{ textAlign: "center", fontSize: 34 }}>Lote guardado</h1>
        <p style={{ textAlign: "center", fontSize: 20 }}>
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
            <h2 style={{ fontSize: 22 }}>¿Y ahora?</h2>
            <p>
              Hay {cerca.length === 1 ? "1 venta conjunta" : `${cerca.length} ventas conjuntas`} de {categoryLabel(lote!.category).toLowerCase()} cerca tuyo. Sumate para llegar a un comprador más grande.
            </p>
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
