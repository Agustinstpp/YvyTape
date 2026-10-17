import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { HeadsProgress } from "@/components/ui";
import { getPoolDetail } from "@/features/pools/queries";
import { getAvailableLots } from "@/features/lots/queries";
import { cercanosPara, masCercanosQueCompletan, RADIO_KM, type Cercano } from "@/lib/front/cercanos";
import { categoryLabel, fmtInt } from "@/lib/ui/format";
import { InvitarForm } from "./form";

export const metadata = { title: "Completá la venta · YvyTape" };

// Dibujo: centro del radio y escala (150 px = 50 km)
const CX = 195;
const CY = 205;
const ESCALA = 150 / RADIO_KM;

function posicion(c: Cercano) {
  if (c.mismaZona) {
    // Misma localidad: se separa un poco del centro para que se vea
    return { x: CX + 58, y: CY - 46 };
  }
  return { x: CX + c.dx * ESCALA, y: CY - c.dy * ESCALA };
}

function CabezaVaca({ x, y, oscura }: { x: number; y: number; oscura: boolean }) {
  return (
    <g transform={`translate(${x - 12} ${y - 12}) scale(0.86)`} fill="none" stroke={oscura ? "#FFF8EC" : "#6B3E26"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8l-4-2M22 8l4-2" />
      <path d="M7 7c0-3 3-5 7-5s7 2 7 5v8c0 4-3 8-7 8s-7-4-7-8z" />
      <ellipse cx="14" cy="18" rx="5" ry="3.5" fill={oscura ? "#FFF8EC" : "#F2B705"} />
      <circle cx="11" cy="10" r="1" fill={oscura ? "#FFF8EC" : "#6B3E26"} />
      <circle cx="17" cy="10" r="1" fill={oscura ? "#FFF8EC" : "#6B3E26"} />
    </g>
  );
}

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

      <figure className="cerca-mapa">
        <svg viewBox="0 0 390 410" width="100%" role="img" aria-label={`Mapa de ${venta.zone} y localidades a menos de ${RADIO_KM} km con ${cat} disponibles`}>
          <rect width="390" height="410" rx="18" fill="#F3E7CC" />
          <path d="M60 60h80v50H60zM250 290h80v60h-80zM40 300h60v50H40zM270 50h70v45h-70z" fill="#EBDCB8" />
          <circle cx={CX} cy={CY} r="150" fill="#FFF8EC" fillOpacity="0.5" stroke="#6B3E26" strokeWidth="2" strokeDasharray="8 8" opacity="0.7" />
          <text x={CX} y={CY + 172} textAnchor="middle" className="cerca-txt">Radio de {RADIO_KM} km</text>

          {cercanos.map((c) => {
            const p = posicion(c);
            const d = `M${p.x} ${p.y} L${CX} ${CY}`;
            return (
              <g key={`camino-${c.zona}`}>
                <path d={d} stroke="#C7A774" strokeWidth="6" strokeLinecap="round" />
                <path d={d} stroke="#F3E7CC" strokeWidth="1.5" strokeDasharray="4 6" className="mapa-anim mapa-linea" />
                <path id={`ruta-${c.zona.replace(/\W/g, "")}`} d={d} fill="none" />
              </g>
            );
          })}

          {/* La venta */}
          <circle cx={CX} cy={CY} r="28" fill="#6B3E26" />
          <CabezaVaca x={CX} y={CY} oscura />
          <rect x={CX - 40} y={CY + 32} width="80" height="24" rx="12" fill="#6B3E26" />
          <text x={CX} y={CY + 49} textAnchor="middle" className="cerca-badge" fill="#FFFFFF">
            {fmtInt(venta.current_heads)} en venta
          </text>
          <text x={CX} y={CY - 36} textAnchor="middle" className="cerca-txt">{venta.zone}</text>

          {/* Localidades cercanas */}
          {cercanos.map((c) => {
            const p = posicion(c);
            const ruta = `ruta-${c.zona.replace(/\W/g, "")}`;
            return (
              <g key={c.zona}>
                <circle cx={p.x} cy={p.y} r="22" fill="#FFFFFF" stroke="#E8751A" strokeWidth="3" />
                <CabezaVaca x={p.x} y={p.y} oscura={false} />
                <rect x={p.x + 16} y={p.y - 26} width="34" height="22" rx="11" fill="#E8751A" />
                <text x={p.x + 33} y={p.y - 10} textAnchor="middle" className="cerca-badge" fill="#1A1A1A">{c.cabezas}</text>
                {!c.mismaZona ? (
                  <text x={p.x} y={p.y + 38} textAnchor="middle" className="cerca-txt">{c.zona}</text>
                ) : null}
                {/* Vaquita que camina hacia la venta */}
                <g className="mapa-anim">
                  <circle r="5" fill="#6B3E26" stroke="#FFF8EC" strokeWidth="1.5">
                    <animateMotion dur="5s" repeatCount="indefinite">
                      <mpath href={`#${ruta}`} />
                    </animateMotion>
                  </circle>
                </g>
              </g>
            );
          })}

          {cercanos.length === 0 ? (
            <text x={CX} y="40" textAnchor="middle" className="cerca-txt">No hay {cat} disponibles cerca por ahora</text>
          ) : null}
        </svg>
        <figcaption className="mapa-ley">
          <span><i className="ley-dot" style={{ background: "#6B3E26" }} /> La venta conjunta</span>
          <span><i className="ley-dot" style={{ background: "#FFFFFF", borderColor: "#E8751A" }} /> Cerca, con {cat} disponibles</span>
        </figcaption>
      </figure>

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
