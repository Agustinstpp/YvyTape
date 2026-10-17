import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { getPoolDetail } from "@/features/pools/queries";
import { NuevaConsultaForm } from "./form";

export const metadata = { title: "Nueva consulta · YvyTape" };

export default async function NuevaConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ venta?: string; lote?: string; asunto?: string }>;
}) {
  await requireProfile();
  const { venta, lote, asunto } = await searchParams;
  let contexto = "Consulta al equipo YvyTape";
  if (venta) {
    const { data } = await getPoolDetail(venta);
    if (data) contexto = `Venta «${data.title}» · llega al martillero y a los productores`;
  } else if (lote) {
    contexto = "Consulta sobre un lote · llega al martillero";
  }

  return (
    <AppShell title="Nueva consulta" back={{ href: venta ? `/ventas-conjuntas/${venta}` : "/mensajes", label: "Volver" }}>
      <p className="muted">{contexto}</p>
      <NuevaConsultaForm poolId={venta ?? ""} lotId={lote ?? ""} asunto={asunto ?? ""} contexto={contexto} />
    </AppShell>
  );
}
