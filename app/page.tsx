import Link from "next/link";
import { getSessionProfile, homeFor } from "@/lib/session";
import {
  IconArrowRight,
  IconChat,
  IconCheck,
  IconGroup,
  IconLock,
  IconLots,
  IconPin,
  IconSearch,
  IconTag,
  IconTruck,
  Logo,
} from "@/components/icons";

const RUTA = [
  { titulo: "Campo de cría", categoria: "Terneros y terneras", tamano: 34, texto: "Nacen y se crían con la madre hasta el destete.", yvy: "venta conjunta de terneros con los vecinos de la zona." },
  { titulo: "Recría e invernada", categoria: "Novillitos y vaquillonas", tamano: 40, texto: "Ganan peso a campo durante meses.", yvy: "se compran terneros en volumen y se venden novillitos juntos." },
  { titulo: "Engorde o feedlot", categoria: "Novillos", tamano: 46, texto: "Terminan el engorde hasta el peso de faena.", yvy: "el feedlot encuentra lotes grandes y parejos de la zona." },
  { titulo: "Frigorífico", categoria: "Faena", tamano: 46, texto: "Compra por kg y procesa la carne.", yvy: "oferta por kg a toda la venta conjunta, con el martillero cerrando." },
  { titulo: "Mercado", categoria: "Carnicería y supermercado", tamano: 40, texto: "La carne llega a la mesa de la región.", yvy: null },
];

/** Vaca simple dibujada a mano (ilustración genérica). */
function Vaca({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="22" cy="26" rx="15" ry="10" fill="#6B3E26" />
      <ellipse cx="17" cy="24" rx="4" ry="3" fill="#FFF8EC" />
      <ellipse cx="27" cy="29" rx="3" ry="2.2" fill="#FFF8EC" />
      <rect x="10" y="33" width="3.5" height="9" rx="1.5" fill="#4A2918" />
      <rect x="28" y="33" width="3.5" height="9" rx="1.5" fill="#4A2918" />
      <ellipse cx="38" cy="20" rx="7" ry="6" fill="#6B3E26" />
      <ellipse cx="41" cy="23" rx="4" ry="2.8" fill="#E8751A" />
      <path d="M34 14l-2-4M40 14l2-4" stroke="#F2B705" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="37" cy="18.5" r="1.2" fill="#1A1A1A" />
    </svg>
  );
}

/** Landing: cuenta qué es YvyTape y recién desde acá se entra a la plataforma. */
export default async function Landing() {
  const perfil = await getSessionProfile();
  const entrar = perfil ? homeFor(perfil.role) : "/ingresar";
  const entrarTexto = perfil ? "Ir a mi panel" : "Entrar a la plataforma";

  return (
    <div className="app">
      <header className="topbar land-top">
        <Link href="/" className="brand" aria-label="YvyTape, inicio">
          <Logo size={36} />
          YvyTape
        </Link>
        <nav aria-label="Secciones" className="land-nav">
          <a href="#recorrido">Recorrido</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#productores">Productores</a>
          <a href="#compradores">Compradores</a>
          <a href="#preguntas">Preguntas</a>
        </nav>
        <Link href={entrar} className="btn btn-y btn-inline">
          {perfil ? "Mi panel" : "Ingresar"}
        </Link>
      </header>

      {/* ---------- Portada ---------- */}
      <section className="hero">
        <div className="stack" style={{ gap: 18 }}>
          <span className="tag" style={{ background: "var(--amarillo)", alignSelf: "flex-start" }}>
            Ganadería del NEA · Corrientes
          </span>
          <h1>Vendé en conjunto. Llegá a compradores más grandes.</h1>
          <p style={{ fontSize: 18 }} className="muted">
            YvyTape junta los lotes de productores vecinos para armar una venta grande y ofrecerla a frigoríficos,
            supermercados, abastecedores y feedlots. Un martillero coordina y cierra la operación, y todo se habla
            dentro de la plataforma.
          </p>
          <div className="row-wrap" style={{ gap: 12 }}>
            <Link href={entrar} className="btn btn-p" style={{ width: "auto" }}>
              {entrarTexto}
              <IconArrowRight size={22} strokeWidth={2.4} />
            </Link>
            <Link href="/ofertas" className="btn btn-s" style={{ width: "auto" }}>
              <IconSearch size={22} strokeWidth={2.4} />
              Ver ofertas
            </Link>
          </div>
        </div>
        <svg viewBox="0 0 560 400" width="100%" role="img" aria-label="Un camino de tierra que cruza el campo hacia el sol del atardecer" style={{ borderRadius: 24, border: "2px solid var(--borde)" }}>
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

      {/* ---------- El problema ---------- */}
      <section className="land-sec land-white">
        <div className="wide">
          <h2 className="land-h2">El problema</h2>
          <p className="muted land-lead">
            La mayoría de los productores del NEA tiene pocos animales por lote. Así es difícil llegar a los compradores
            que pagan mejor.
          </p>
          <div className="grid3">
            {[
              ["Lotes chicos", "Un frigorífico o un feedlot pide cientos de cabezas. Con 50 o 100 animales quedás afuera."],
              ["Pocos canales de venta", "Se termina vendiendo a quien pasa, con poca información sobre precios y compradores."],
              ["Costos que no se ven", "El flete y los tiempos se conocen recién al final, cuando ya cerraste el trato."],
            ].map(([t, d]) => (
              <div key={t} className="card" style={{ background: "var(--crema)" }}>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- La solución ---------- */}
      <section className="land-sec">
        <div className="wide">
          <h2 className="land-h2">La solución: la venta conjunta</h2>
          <p className="muted land-lead">
            Productores de la misma zona suman sus lotes de la misma categoría hasta llegar a la cantidad que pide el
            comprador. Cada uno sigue siendo dueño de su parte y decide si acepta la oferta.
          </p>
          <div className="card land-example">
            <p style={{ fontWeight: 700 }}>Ejemplo en Curuzú Cuatiá</p>
            <div className="land-bars" role="list" aria-label="Cuatro productores suman 400 novillos">
              {[
                ["Don Juan", 120],
                ["Doña Carmen", 80],
                ["Cabaña Las Lilas", 150],
                ["Don Pedro", 50],
              ].map(([n, c]) => (
                <div key={n} role="listitem" className="land-bar" style={{ flexGrow: Number(c) }}>
                  <strong>{c}</strong>
                  <span>{n}</span>
                </div>
              ))}
            </div>
            <p>
              <strong>400 novillos juntos</strong> → una sola oferta por kg de un frigorífico, que cada productor acepta
              por su parte.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Recorrido de la hacienda ---------- */}
      <section id="recorrido" className="land-sec">
        <div className="wide">
          <h2 className="land-h2">El recorrido de la hacienda</h2>
          <p className="muted land-lead">
            Un animal pasa por varios campos antes de llegar al mercado. En cada venta del camino, YvyTape junta a los
            productores de la zona para vender mejor.
          </p>
          <ol className="ruta" aria-label="Recorrido de la hacienda, del campo de cría al mercado">
            {RUTA.map((e, i) => (
              <li key={e.titulo} className="ruta-paso">
                <div className="ruta-marca" aria-hidden="true">
                  <Vaca size={e.tamano} />
                </div>
                <span className="ruta-num">{i + 1}</span>
                <h3>{e.titulo}</h3>
                <p className="ruta-cat">{e.categoria}</p>
                <p>{e.texto}</p>
                {e.yvy ? <p className="ruta-yvy"><strong>Con YvyTape:</strong> {e.yvy}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section id="como-funciona" className="land-sec land-white">
        <div className="wide">
          <h2 className="land-h2">Cómo funciona</h2>
          <ol className="steps">
            {[
              ["Registrá tu lote", "Categoría, raza, cantidad de cabezas, peso promedio y localidad. Si tenés caravana electrónica, la cargás."],
              ["Sumate a una venta conjunta", "Te mostramos ventas cercanas de tu misma categoría, o armás una nueva."],
              ["Llega la oferta", "Cuando la venta alcanza el objetivo, los compradores ofertan un precio por kg. Te avisamos en YvyTape."],
              ["Aceptás tu parte", "Ves cuánto cobrarías por tus animales y respondés con un toque. Si todos aceptan, el martillero cierra."],
            ].map(([t, d], i) => (
              <li key={t} className="card" style={{ background: "var(--crema)" }}>
                <span className="num">{i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Para quién ---------- */}
      <section className="land-sec">
        <div className="wide grid2">
          <div id="productores" className="card">
            <IconLots size={32} strokeWidth={2.2} />
            <h2 className="land-h2">Para productores</h2>
            <ul className="land-list">
              <li><IconCheck size={20} strokeWidth={2.6} /> Llegás a compradores grandes sin tener un lote grande.</li>
              <li><IconCheck size={20} strokeWidth={2.6} /> Ves el precio por kg y lo que cobrarías antes de aceptar.</li>
              <li><IconCheck size={20} strokeWidth={2.6} /> Podés sacar tu lote mientras la venta siga abierta.</li>
              <li><IconCheck size={20} strokeWidth={2.6} /> Pensado para usar desde el celular, con letra clara y botones grandes.</li>
            </ul>
            <Link href={perfil ? "/mis-lotes/nuevo" : "/registrarse?rol=productor"} className="btn btn-p">
              Registrar un lote
            </Link>
          </div>
          <div id="compradores" className="card" style={{ background: "var(--marron)", borderColor: "var(--marron)", color: "var(--blanco)" }}>
            <IconGroup size={32} strokeWidth={2.2} />
            <h2 className="land-h2" style={{ color: "var(--blanco)" }}>Para compradores</h2>
            <ul className="land-list">
              <li><IconCheck size={20} strokeWidth={2.6} /> Lotes grandes de una misma zona y categoría.</li>
              <li><IconCheck size={20} strokeWidth={2.6} /> La composición de cada venta a la vista: establecimientos, cabezas y peso.</li>
              <li><IconCheck size={20} strokeWidth={2.6} /> Ofertás por kg y seguís el estado de cada oferta.</li>
              <li><IconCheck size={20} strokeWidth={2.6} /> También hay lotes individuales para compras chicas.</li>
            </ul>
            <Link href={perfil ? "/ofertas" : "/registrarse?rol=comprador"} className="btn btn-y">
              Ver ofertas para compradores
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Herramientas ---------- */}
      <section className="land-sec land-white">
        <div className="wide">
          <h2 className="land-h2">Todo en un solo lugar</h2>
          <div className="grid3">
            {[
              [IconTag, "Martillero y remates virtuales", "Un martillero contratado coordina las ventas, controla las respuestas y hace el cierre."],
              [IconPin, "Mapa regional", "Lotes y ventas conjuntas por localidad, sin mostrar la ubicación exacta de ningún campo."],
              [IconTruck, "Simulador de flete", "Calculá un costo estimado de transporte según la cantidad de cabezas y la distancia."],
              [IconChat, "Mensajería interna", "Las consultas entre productores, compradores y el martillero quedan dentro de YvyTape."],
              [IconCheck, "Lotes con estado claro", "Cada lote dice si sus datos son declarados por el productor o revisados por el equipo."],
              [IconLock, "Tus datos, cuidados", "Solo se muestra el establecimiento y la localidad. No se comparten teléfonos ni correos."],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof IconTag;
              return (
                <div key={t as string} className="card land-feature">
                  <span className="land-ico"><I size={26} strokeWidth={2.2} /></span>
                  <h3>{t as string}</h3>
                  <p>{d as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Preguntas ---------- */}
      <section id="preguntas" className="land-sec">
        <div className="wide" style={{ maxWidth: 820 }}>
          <h2 className="land-h2">Preguntas frecuentes</h2>
          {[
            ["¿Qué pasa si no me conviene la oferta?", "Respondés que no. La oferta se cae y la venta sigue esperando otras ofertas. Nadie te obliga a vender."],
            ["¿Quién cierra la venta?", "El martillero, cuando todos los productores de la venta aceptaron la misma oferta."],
            ["¿Por qué no hay WhatsApp ni teléfonos?", "Para que todo quede registrado y ordenado: las consultas y los avisos se manejan con la mensajería de YvyTape."],
            ["¿Qué quiere decir «declarado» y «revisado»?", "Declarado: lo informó el productor. Revisado: el equipo de YvyTape vio la documentación. No reemplaza los controles oficiales."],
            ["¿Necesito computadora?", "No. YvyTape funciona en el celular, con letra clara y botones grandes."],
          ].map(([q, a]) => (
            <details key={q} className="card land-faq">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- Cierre ---------- */}
      <section className="land-sec land-cta">
        <div className="wide" style={{ alignItems: "center", textAlign: "center" }}>
          <h2 className="land-h2" style={{ color: "var(--negro)" }}>Del campo al mercado, juntos.</h2>
          <p>Entrá a la plataforma para registrar tu lote o ver las ventas abiertas.</p>
          <Link href={entrar} className="btn btn-p" style={{ width: "auto", background: "var(--negro)", color: "var(--blanco)" }}>
            {entrarTexto}
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
            ¿Necesitás ayuda? <Link href={perfil ? "/mensajes/nueva" : "/ingresar"}>Escribinos desde Mensajes</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
