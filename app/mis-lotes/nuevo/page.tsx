import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { getMyFarms } from "@/features/auth/queries";
import { LoteForm } from "./form";

export const metadata = { title: "Registrar lote · YvyTape" };

export default async function NuevoLotePage() {
  const perfil = await requireProfile(["productor"]);
  const { data: farms } = await getMyFarms();

  return (
    <AppShell title="Registrar lote" back={{ href: "/mis-lotes", label: "Volver a mis lotes" }}>
      <LoteForm
        farms={(farms ?? []).map((f) => ({ id: f.id, name: f.name, zone: f.zone }))}
        zonaPerfil={perfil.zone ?? ""}
      />
    </AppShell>
  );
}
