import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { LotStatusTag, Empty } from "@/components/ui";
import { ventasDelProductor } from "@/lib/front/derivados";
import { IconPin, IconPlus } from "@/components/icons";
import { categoryLabel, fmtInt, fmtKg } from "@/lib/ui/format";
import type { LivestockLotWithFarm } from "@/lib/types/domain";

export const metadata = { title: "Mis lotes · YvyTape" };

export default async function MisLotesPage() {
  const perfil = await requireProfile(["productor"]);
  const { lotes, ventas } = await ventasDelProductor(perfil);
  const ventaDe = (id: string) => ventas.find((v) => v.misLotes.some((l) => l.id === id))?.pool;
  const activos = lotes.filter((l) => l.status !== "vendido");
  const vendidos = lotes.filter((l) => l.status === "vendido");

  const Tarjeta = ({ lote }: { lote: LivestockLotWithFarm }) => {
    const venta = ventaDe(lote.id);
    return (
      <article className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 19 }}>
            {categoryLabel(lote.category)} · {lote.breed}
          </h2>
          <LotStatusTag status={lote.status} />
        </div>
        <p>
          <strong style={{ fontSize: 20 }}>{fmtInt(lote.head_count)}</strong> cabezas · {fmtKg(Number(lote.average_weight_kg))} promedio (declarado)
        </p>
        <p className="small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <IconPin size={20} />
          {lote.farm?.name ? `${lote.farm.name} · ` : ""}
          {lote.farm?.zone ?? ""}
        </p>
        {venta ? (
          <Link href={`/ventas-conjuntas/${venta.id}`} className="link-btn">
            En la venta «{venta.title}»
          </Link>
        ) : lote.status === "disponible" ? (
          <Link href={`/ventas-conjuntas?categoria=${lote.category}`} className="link-btn">
            Sumarlo a una venta conjunta
          </Link>
        ) : null}
      </article>
    );
  };

  return (
    <AppShell title="Mis lotes" perfil={perfil} current="lotes">
      <Link href="/mis-lotes/nuevo" className="btn btn-p">
        <IconPlus size={24} strokeWidth={2.4} />
        Registrar un lote nuevo
      </Link>
      {activos.length === 0 ? (
        <Empty title="Todavía no registraste lotes">
          <p className="small">Cargá el primero y te mostramos ventas conjuntas cerca tuyo.</p>
        </Empty>
      ) : (
        activos.map((l) => <Tarjeta key={l.id} lote={l} />)
      )}
      {vendidos.length > 0 ? (
        <>
          <h2 style={{ marginTop: 8 }}>Vendidos</h2>
          {vendidos.map((l) => (
            <Tarjeta key={l.id} lote={l} />
          ))}
        </>
      ) : null}
    </AppShell>
  );
}
