import { getSessionProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { FreightCalculator } from "@/components/flete/FreightCalculator";

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

  return (
    <AppShell title="Flete estimado" back={{ href: volver, label: "Volver" }}>
      <p>
        Calculá cuánto puede costar llevar los animales, con paradas y kilómetros. Es una cuenta orientativa: el precio final lo arreglás con el transportista.
      </p>
      {/* Simulador del módulo de logística (feat/geografia-logistica) */}
      <FreightCalculator initialHeads={Number.isInteger(n) && n > 0 ? n : undefined} poolId={venta} />
    </AppShell>
  );
}
