import { getSessionProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { FreightCalculator, RealPoolFreightData } from "@/components/flete/FreightCalculator";
import { getPoolDetail } from "@/features/pools/queries";
import { ProducerContributionInput } from "@/features/freight/types";

export const metadata = { title: "Flete estimado · YvyTape" };

export default async function FletePage({
  searchParams,
}: {
  searchParams: Promise<{ cabezas?: string; venta?: string }>;
}) {
  const perfil = await getSessionProfile();
  const { cabezas, venta } = await searchParams;
  const n = Number(cabezas);
  const volver = venta ? `/ventas-conjuntas/${venta}` : perfil?.role === "productor" ? "/inicio" : "/ofertas";

  let realPoolData: RealPoolFreightData | undefined;

  if (venta) {
    const { data: pool } = await getPoolDetail(venta);
    if (pool) {
      const prodMap = new Map<string, { name: string; heads: number }>();
      let totalWeight = 0;

      for (const m of pool.members) {
        if (!m.lot) continue;
        const prodId = m.lot.producer_id || m.lot.producer?.id || "p";
        const prodName = m.lot.producer?.full_name || "Productor participante";
        const cur = prodMap.get(prodId) || { name: prodName, heads: 0 };
        cur.heads += m.lot.head_count;
        prodMap.set(prodId, cur);
        totalWeight += m.lot.head_count * (Number(m.lot.average_weight_kg) || 0);
      }

      const contributions: ProducerContributionInput[] = Array.from(prodMap.entries()).map(([id, p]) => ({
        producerId: id,
        producerName: p.name,
        heads: p.heads,
      }));

      realPoolData = {
        poolId: pool.id,
        title: pool.title,
        zone: pool.zone,
        heads: pool.current_heads,
        estimatedWeightKg: Math.round(totalWeight),
        producersCount: prodMap.size,
        contributions,
      };
    }
  }

  return (
    <AppShell title="Flete estimado" back={{ href: volver, label: "Volver" }}>
      <p>
        Calculá cuánto puede costar llevar los animales, con paradas y kilómetros. Es una cuenta orientativa: el precio final lo arreglás con el transportista.
      </p>
      {/* Simulador de logística integrado con datos de venta conjunta */}
      <FreightCalculator
        initialHeads={realPoolData?.heads || (Number.isInteger(n) && n > 0 ? n : undefined)}
        poolId={venta}
        realPoolData={realPoolData}
      />
    </AppShell>
  );
}
