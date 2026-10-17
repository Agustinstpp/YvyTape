import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { avisosDelProductor, ventasDelProductor } from "@/lib/front/derivados";
import { IconArrowRight, IconBell, IconLogout, IconPlus } from "@/components/icons";
import { categoryLabel, fmtInt } from "@/lib/ui/format";
import { salir } from "@/app/acciones";

export const metadata = { title: "Inicio · YvyTape" };

export default async function InicioPage() {
  const perfil = await requireProfile(["productor"]);
  const [{ lotes, ventas, todas }, avisos] = await Promise.all([ventasDelProductor(perfil), avisosDelProductor(perfil)]);

  const disponibles = lotes.filter((l) => l.status === "disponible");
  const cabezasDisponibles = disponibles.reduce((a, l) => a + l.head_count, 0);
  const comprometidos = lotes.filter((l) => l.status === "reservado").length;
  const activos = ventas.filter((v) => !["cerrado", "cancelado"].includes(v.pool.status)).length;
  const urgentes = avisos.filter((a) => a.urgente);

  // Venta abierta cerca, de una categoría que el productor tiene disponible
  const misCategorias = new Set(disponibles.map((l) => l.category));
  const misZonas = new Set(disponibles.map((l) => l.farm?.zone?.toLowerCase()));
  const sugerida = todas.find(
    (p) => p.status === "abierto" && misCategorias.has(p.category) && misZonas.has(p.zone.toLowerCase()) && !ventas.some((v) => v.pool.id === p.id)
  );

  return (
    <AppShell title={`Hola, ${perfil.full_name}`} subtitle={perfil.zone ?? undefined} perfil={perfil} current="inicio">
      {urgentes.map((a) => (
        <Link key={a.id} href={a.href} className="card accent">
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 22 }}>
            <IconBell size={28} />
            {a.titulo}
          </span>
          <span>{a.texto}</span>
          <span className="btn" style={{ background: "var(--blanco)", color: "var(--negro)", minHeight: 52 }}>
            Ver la oferta
            <IconArrowRight size={22} strokeWidth={2.4} />
          </span>
        </Link>
      ))}

      <div className="stats">
        <Link href="/mis-lotes" className="stat"><b>{fmtInt(lotes.filter((l) => l.status !== "vendido").length)}</b>Mis lotes</Link>
        <Link href="/mis-lotes" className="stat"><b>{fmtInt(cabezasDisponibles)}</b>Cabezas disponibles</Link>
        <Link href="/mis-lotes" className="stat"><b>{fmtInt(comprometidos)}</b>Lotes en ventas conjuntas</Link>
        <Link href="/ventas-conjuntas?ver=mias" className="stat"><b>{fmtInt(activos)}</b>Ventas conjuntas activas</Link>
      </div>

      <Link href="/mis-lotes/nuevo" className="btn btn-p" style={{ minHeight: 64, fontSize: 21 }}>
        <IconPlus size={26} strokeWidth={2.4} />
        Registrar lote
      </Link>

      {sugerida ? (
        <section className="card">
          <h2 style={{ fontSize: 22 }}>Cerca tuyo</h2>
          <p>
            Hay una venta conjunta de <strong>{categoryLabel(sugerida.category).toLowerCase()}</strong> en {sugerida.zone} que necesita{" "}
            {fmtInt(Math.max(0, sugerida.target_heads - sugerida.current_heads))} cabezas más.
          </p>
          <Link href={`/ventas-conjuntas/${sugerida.id}`} className="link-btn">
            Ver la venta <IconArrowRight size={22} strokeWidth={2.4} />
          </Link>
        </section>
      ) : null}

      {lotes.length === 0 ? (
        <p className="card note">Todavía no registraste lotes. Cargá el primero y te mostramos ventas conjuntas cerca tuyo.</p>
      ) : null}

      <form action={salir}>
        <button type="submit" className="link-btn">
          <IconLogout size={22} />
          Salir de YvyTape
        </button>
      </form>
    </AppShell>
  );
}
