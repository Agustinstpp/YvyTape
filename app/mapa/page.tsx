// TODO(geo): YvyMap y FreightCalculator usan textos de 11–15px y paleta gris/verde; pasar a 17px mínimo y colores de marca.
// TODO(geo): si no hay datos reales, getMapOffers muestra DEMO_MAP_OFFERS sin aviso; marcarlo como demostración.
import Link from "next/link";
import { getSessionProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { getAvailableLots } from "@/features/lots/queries";
import { getPools } from "@/features/pools/queries";
import { getMapOffers } from "@/features/geography/queries";
import { YvyMap } from "@/components/mapa/YvyMap";
import { IconSearch } from "@/components/icons";

export const metadata = { title: "Mapa de ofertas · YvyTape" };

/**
 * Mapa regional del módulo de geografía (feat/geografia-logistica).
 * Usa coordenadas por zona, nunca la ubicación exacta de los campos.
 */
export default async function MapaPage() {
  const perfil = await getSessionProfile();
  const [{ data: lotes }, { data: pools }] = await Promise.all([getAvailableLots(), getPools()]);
  const activas = (pools ?? []).filter((p) => ["abierto", "objetivo_alcanzado", "en_negociacion"].includes(p.status));
  const ofertas = getMapOffers(lotes ?? [], activas);
  const sinDatos = (lotes ?? []).length === 0 && activas.length === 0;

  return (
    <AppShell
      title="Mapa de ofertas"
      subtitle="Productores y lotes por zona"
      perfil={perfil}
      current={perfil?.role === "productor" ? "ventas" : "ofertas"}
      back={perfil ? undefined : { href: "/ofertas", label: "Volver a ofertas" }}
    >
      <p className="small">
        Los puntos marcan la zona, no la ubicación exacta de cada campo. Tocá uno para ver el lote o la venta conjunta.
      </p>
      {sinDatos ? (
        <p className="tag" style={{ background: "var(--crema)", border: "2px dotted var(--marron)", color: "var(--marron)", alignSelf: "flex-start", whiteSpace: "normal" }}>
          Datos de demostración: todavía no hay ofertas cargadas
        </p>
      ) : null}
      <YvyMap initialOffers={ofertas} height={460} />
      <Link href="/ofertas" className="btn btn-s">
        <IconSearch size={24} strokeWidth={2.4} />
        Ver las ofertas en lista
      </Link>
    </AppShell>
  );
}
