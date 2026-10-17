import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { NuevaVentaForm } from "./form";

export const metadata = { title: "Nueva venta conjunta · YvyTape" };

export default async function NuevaVentaPage() {
  const perfil = await requireProfile(["productor", "operador"]);
  return (
    <AppShell title="Nueva venta conjunta" back={{ href: "/ventas-conjuntas", label: "Volver a ventas conjuntas" }}>
      <p>Armá una venta para que productores de tu zona sumen animales de la misma categoría hasta llegar al objetivo.</p>
      <NuevaVentaForm zona={perfil.zone ?? ""} />
    </AppShell>
  );
}
