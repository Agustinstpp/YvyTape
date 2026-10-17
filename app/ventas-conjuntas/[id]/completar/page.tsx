import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { HeadsProgress } from "@/components/ui";
import { getPoolDetail } from "@/features/pools/queries";
import { getAvailableLots } from "@/features/lots/queries";
import { cercanosPara, lotesCompatibles, masCercanosQueCompletan } from "@/lib/front/cercanos";
import { getMapOffers } from "@/features/geography/queries";
import { YvyMap } from "@/components/mapa/YvyMap";
import { categoryLabel, fmtInt } from "@/lib/ui/format";
import { InvitarForm } from "./form";

export const metadata = { title: "Completá la venta · YvyTape" };

export default async function CompletarPage({ params }: { params: Promise<{ id: string }> }) {
  const perfil = await requireProfile(["productor", "operador"]);
  const { id } = await params;
  const { data: venta } = await getPoolDetail(id);
  if (!venta) notFound();

  const faltan = Math.max(0, venta.target_heads - venta.current_heads);
  const { data: disponibles } = await getAvailableLots({ category: venta.category });
  const cercanos = cercanosPara(venta, disponibles ?? [], perfil.id);
  const completan = masCercanosQueCompletan(cercanos, faltan);
  const cat = categoryLabel(venta.category).toLowerCase();
  // Mismo mapa que /mapa (geografía): la venta y los lotes que pueden sumarse
  const ofertas = getMapOffers(lotesCompatibles(venta, disponibles ?? [], perfil.id), [{ ...venta, members_count: venta.members.length }]);

  return (
    <AppShell
      title="Completá la venta"
      back={{ href: `/ventas-conjuntas/${venta.id}`, label: "Volver a la venta" }}
      perfil={perfil}
      current={perfil.role === "operador" ? "operador" : "ventas"}
    >
      <section className="card">
        <strong style={{ fontSize: 18 }}>{venta.title}</strong>
        <HeadsProgress current={venta.current_heads} target={venta.target_heads} big />
      </section>

      <p className="small">Los puntos marcan la localidad, no la ubicación exacta de cada campo.</p>
      <YvyMap initialOffers={ofertas} height={420} showFilters={false} showSummary={false} />

      {cercanos.length > 0 ? (
        <section className="card rows">
          <h2 style={{ marginTop: 12 }}>Pueden sumarse</h2>
          {cercanos.map((c) => (
            <div key={c.zona} className="kv-row" style={{ alignItems: "center" }}>
              <span style={{ display: "flex", gap: 12, alignItems: "center", color: "var(--negro)" }}>
                <span className="cerca-num">{fmtInt(c.cabezas)}</span>
                <span>
                  <strong>{c.zona}</strong>
                  <br />
                  <span className="small">
                    {fmtInt(c.cabezas)} {cat} · {c.mismaZona ? "misma localidad" : `a ${c.km} km`}
                  </span>
                </span>
              </span>
              <InvitarForm poolId={venta.id} titulo={venta.title} grupos={[{ zona: c.zona, lotes: c.lotes.map((l) => l.id) }]} texto="Invitar" />
            </div>
          ))}
        </section>
      ) : (
        <p className="card note">
          Todavía no hay productores cerca con {cat} disponibles. Podés compartir la venta por Mensajes con el martillero.
        </p>
      )}

      {completan.length > 0 && faltan > 0 ? (
        <>
          <p className="card note">
            Con <strong>{completan.map((c) => c.zona).join(" y ")}</strong> ({fmtInt(completan.reduce((a, c) => a + c.cabezas, 0))} cabezas) ya se completa la venta.
            Solo mostramos la localidad, nunca el nombre ni el teléfono del productor.
          </p>
          <InvitarForm
            poolId={venta.id}
            titulo={venta.title}
            grupos={completan.map((c) => ({ zona: c.zona, lotes: c.lotes.map((l) => l.id) }))}
            grande
            texto="Invitar a los más cercanos"
          />
        </>
      ) : (
        <p className="small">Solo mostramos la localidad, nunca el nombre ni el teléfono del productor.</p>
      )}

      <Link href={`/ventas-conjuntas/${venta.id}`} className="link-btn" style={{ justifyContent: "center" }}>
        Volver a la venta
      </Link>
    </AppShell>
  );
}
