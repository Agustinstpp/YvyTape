import Link from "next/link";
import type { Profile, UserRole } from "@/lib/types/domain";
import { mensajes } from "@/lib/front/mensajes";
import { salir } from "@/app/acciones";
import { avisosDelProductor, negociacionesDelMartillero } from "@/lib/front/derivados";
import {
  IconArrowLeft,
  IconChat,
  IconGroup,
  IconHome,
  IconLogout,
  IconLots,
  IconSearch,
  IconTag,
  Logo,
} from "@/components/icons";

export type NavKey = "inicio" | "lotes" | "ventas" | "mensajes" | "ofertas" | "mis-ofertas" | "operador";

const NAV: Record<UserRole, { key: NavKey; href: string; label: string; Icon: (p: { size?: number; strokeWidth?: number }) => React.ReactElement }[]> = {
  productor: [
    { key: "inicio", href: "/inicio", label: "Inicio", Icon: IconHome },
    { key: "lotes", href: "/mis-lotes", label: "Mis lotes", Icon: IconLots },
    { key: "ventas", href: "/ventas-conjuntas", label: "Ventas", Icon: IconGroup },
    { key: "mensajes", href: "/mensajes", label: "Mensajes", Icon: IconChat },
  ],
  comprador: [
    { key: "ofertas", href: "/ofertas", label: "Ofertas", Icon: IconSearch },
    { key: "mis-ofertas", href: "/mis-ofertas", label: "Mis ofertas", Icon: IconTag },
    { key: "mensajes", href: "/mensajes", label: "Mensajes", Icon: IconChat },
  ],
  operador: [
    { key: "operador", href: "/operador", label: "Ventas", Icon: IconGroup },
    { key: "mensajes", href: "/mensajes", label: "Mensajes", Icon: IconChat },
  ],
};

type ShellProps = {
  title: string;
  subtitle?: string;
  /** Si se indica, muestra la flecha para volver en lugar del logo. */
  back?: { href: string; label: string };
  perfil?: Profile | null;
  current?: NavKey;
  children: React.ReactNode;
};

/** Barra superior marrón + contenido + menú inferior según el rol. */
// TODO(perf): en cada pantalla del productor se calculan los avisos pidiendo el detalle de TODAS las ventas (N+1).
//   Con un endpoint de "mis ventas" o de avisos del backend se resuelve.
export async function AppShell({ title, subtitle, back, perfil, current, children }: ShellProps) {
  let unread = 0;
  let listasParaCerrar = 0;
  if (perfil) {
    if (perfil.role === "operador") {
      listasParaCerrar = (await negociacionesDelMartillero()).filter((n) => n.lista).length;
    }
    unread = await mensajes.sinLeer(perfil);
    if (perfil.role === "productor") {
      unread += (await avisosDelProductor(perfil)).filter((a) => a.urgente).length;
    }
  }
  const items = perfil ? NAV[perfil.role] : [];

  return (
    <div className={items.length > 0 ? "app con-menu" : "app"}>
      <header className="topbar">
        {back ? (
          <Link href={back.href} className="icon-btn" aria-label={back.label}>
            <IconArrowLeft size={26} strokeWidth={2.4} />
          </Link>
        ) : (
          <Logo size={36} />
        )}
        <div style={{ minWidth: 0 }}>
          <h1>{title}</h1>
          {subtitle ? <p className="sub">{subtitle}</p> : null}
        </div>
        {perfil ? (
          <form action={salir} className="salir-form">
            <button type="submit" className="salir-btn" aria-label="Cerrar sesión">
              <IconLogout size={22} strokeWidth={2.4} />
              <span>Salir</span>
            </button>
          </form>
        ) : null}
      </header>
      <main className="page">{children}</main>
      {items.length > 0 ? (
        <nav
          className="bottom-nav"
          aria-label="Menú"
          style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
        >
          <Link href="/" className="nav-brand" aria-label="YvyTape, inicio">
            <Logo size={34} />
            YvyTape
          </Link>
          {items.map(({ key, href, label, Icon }) => {
            const cantidad = key === "mensajes" ? unread : key === "operador" ? listasParaCerrar : 0;
            const showBadge = cantidad > 0;
            return (
              <Link
                key={key}
                href={href}
                aria-current={key === current ? "page" : undefined}
                aria-label={
                  showBadge
                    ? key === "operador"
                      ? `${label}, ${cantidad} listas para cerrar`
                      : `${label}, ${cantidad} avisos sin leer`
                    : undefined
                }
              >
                <Icon />
                {label}
                {showBadge ? (
                  <span className="badge" aria-hidden="true">
                    {cantidad > 9 ? "9+" : cantidad}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
