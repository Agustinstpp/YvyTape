import Link from "next/link";
import { getSessionProfile, homeFor } from "@/lib/session";
import { IconArrowRight, IconGroup, IconPlus, IconSearch, Logo } from "@/components/icons";

export default async function Landing() {
  const perfil = await getSessionProfile();
  const entrar = perfil ? homeFor(perfil.role) : "/ingresar";

  return (
    <div className="app">
      <header className="topbar" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <Link href="/" className="brand" aria-label="YvyTape, inicio">
          <Logo size={40} />
          YvyTape
        </Link>
        <nav aria-label="Principal" className="row-wrap">
          <Link href="/ofertas" style={{ fontWeight: 700, padding: "12px 8px", textDecoration: "none" }}>
            Ofertas
          </Link>
          <Link href="/mapa" style={{ fontWeight: 700, padding: "12px 8px", textDecoration: "none" }}>
            Mapa
          </Link>
          <Link href={entrar} className="btn btn-y btn-inline">
            {perfil ? "Ir a mi panel" : "Ingresar"}
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="stack" style={{ gap: 22 }}>
          <span className="tag" style={{ background: "var(--amarillo)", alignSelf: "flex-start" }}>
            Ganadería del NEA · Corrientes
          </span>
          <h1>Vendé en conjunto. Llegá a compradores más grandes.</h1>
          <p style={{ fontSize: 22 }} className="muted">
            Juntá tus terneros, novillos o vaquillonas con los de productores vecinos y ofrecé un lote grande a
            frigoríficos, supermercados, abastecedores y feedlots.
          </p>
          <div className="row-wrap" style={{ gap: 12 }}>
            <Link href={perfil ? "/mis-lotes/nuevo" : "/registrarse?rol=productor"} className="btn btn-p" style={{ width: "auto" }}>
              <IconPlus size={24} strokeWidth={2.4} />
              Registrar un lote
            </Link>
            <Link href="/ofertas" className="btn btn-s" style={{ width: "auto" }}>
              <IconSearch size={24} strokeWidth={2.4} />
              Explorar ofertas
            </Link>
          </div>
        </div>
        <svg viewBox="0 0 560 400" width="100%" role="img" aria-label="Un camino de tierra que cruza el campo hacia el sol del atardecer" style={{ borderRadius: 28, border: "2px solid var(--borde)" }}>
          <rect width="560" height="400" fill="#FFF3D6" />
          <circle cx="280" cy="170" r="70" fill="#F2B705" />
          <circle cx="280" cy="170" r="46" fill="#E8751A" />
          <rect y="170" width="560" height="230" fill="#E9C77B" />
          <path d="M0 250c120-24 220-10 300 4s180 18 260 0v146H0z" fill="#B88438" />
          <path d="M268 170h24l130 230H138z" fill="#6B3E26" />
          <path d="M280 182v14M280 214v22M280 260v32M280 320v46" stroke="#F2B705" strokeWidth="6" strokeLinecap="round" />
          <path d="M0 170h560" stroke="#6B3E26" strokeWidth="3" />
        </svg>
      </section>

      <section style={{ background: "var(--blanco)", borderTop: "2px solid var(--borde)", borderBottom: "2px solid var(--borde)" }}>
        <div className="wide">
          <h2 style={{ fontSize: 34 }}>Cómo funciona, en 3 pasos</h2>
          <ol className="steps">
            {[
              ["Registrá tu lote", "Contanos qué animales tenés: categoría, raza, cuántas cabezas y dónde están."],
              ["Sumate a una venta conjunta", "Te mostramos ventas de productores cercanos con tu misma categoría. Juntos llegan a la cantidad que pide el comprador."],
              ["Respondé la oferta", "Cuando llega una oferta te avisamos en YvyTape, con el precio por kg. Aceptás tu parte con un toque."],
            ].map(([t, d], i) => (
              <li key={t} className="card" style={{ background: "var(--crema)" }}>
                <span className="num">{i + 1}</span>
                <h3 style={{ fontSize: 24 }}>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wide">
        <div className="card" style={{ background: "var(--marron)", borderColor: "var(--marron)", color: "var(--blanco)" }}>
          <h2 style={{ color: "var(--blanco)", fontSize: 30 }}>¿Comprás hacienda?</h2>
          <p style={{ fontSize: 20 }}>
            Frigoríficos, supermercados, abastecedores y feedlots encuentran lotes grandes de la zona, con la composición de cada uno a la vista.
          </p>
          <Link href={perfil ? "/ofertas" : "/registrarse?rol=comprador"} className="btn btn-y" style={{ alignSelf: "flex-start", width: "auto" }}>
            <IconGroup size={24} strokeWidth={2.4} />
            Ver ofertas para compradores
            <IconArrowRight size={22} strokeWidth={2.4} />
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: "2px solid var(--borde)", background: "var(--blanco)" }}>
        <div className="wide" style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          <span>
            <strong style={{ color: "var(--marron)" }}>YvyTape</strong> · «yvy» es tierra, «tape» es camino: el camino de la tierra al mercado.
          </span>
          <span>
            ¿Necesitás ayuda? <Link href="/mensajes/nueva">Escribinos desde Mensajes</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
