/**
 * Datos que arman las pantallas a partir de los servicios que ya existen en el
 * backend (sin tablas nuevas): ventas donde participa el productor, avisos y
 * ofertas del comprador.
 */
import { getMyLots } from "@/features/lots/queries";
import { getPools, getPoolDetail } from "@/features/pools/queries";
import { areZonesCompatible } from "@/lib/front/zonas";
import type {
  LivestockLotWithFarm,
  PoolDetail,
  PoolSummary,
  Profile,
} from "@/lib/types/domain";
import { fmtMoney } from "@/lib/ui/format";

export interface VentaDelProductor {
  pool: PoolDetail;
  misLotes: LivestockLotWithFarm[];
}

export interface Aviso {
  id: string;
  titulo: string;
  texto: string;
  href: string;
  urgente: boolean;
}

/**
 * Ventas conjuntas en las que el productor tiene algún lote.
 * El listado de pools no trae los miembros, así que se consulta el detalle de cada uno
 * (alcanza para el volumen de la demo).
 */
// TODO(backend): falta "mis ventas conjuntas" (pools con mis lotes) y "mis ofertas" del comprador; hoy se recorren todas.
export async function ventasDelProductor(perfil: Profile): Promise<{
  lotes: LivestockLotWithFarm[];
  ventas: VentaDelProductor[];
  todas: PoolSummary[];
}> {
  const [{ data: lotes }, { data: pools }] = await Promise.all([getMyLots(), getPools()]);
  const todas = pools ?? [];
  const detalles = await Promise.all(todas.map((p) => getPoolDetail(p.id)));
  const ventas: VentaDelProductor[] = [];
  for (const { data: d } of detalles) {
    if (!d) continue;
    const mios = d.members.filter((m) => m.lot?.producer_id === perfil.id).map((m) => m.lot);
    if (mios.length) ventas.push({ pool: d, misLotes: mios });
  }
  return { lotes: lotes ?? [], ventas, todas };
}

/** Respuesta del productor a la oferta activa de una venta: true, false o null (sin responder). */
export function miRespuesta(detalle: PoolDetail, perfil: Profile): boolean | null {
  const c = detalle.active_offer?.confirmations?.find((x) => x.producer_id === perfil.id);
  return c ? c.accepted : null;
}

/** Avisos del productor: ofertas por responder y ventas que llegaron al objetivo. */
export async function avisosDelProductor(perfil: Profile): Promise<Aviso[]> {
  const { ventas } = await ventasDelProductor(perfil);
  const avisos: Aviso[] = [];
  for (const { pool } of ventas) {
    if (pool.status === "en_negociacion") {
      const oferta = pool.active_offer;
      if (oferta?.status === "pendiente" && miRespuesta(pool, perfil) === null) {
        avisos.push({
          id: `oferta-${oferta.id}`,
          titulo: "Llegó una oferta: respondé tu parte",
          texto: `«${pool.title}» recibió ${fmtMoney(Number(oferta.price_per_kg))} por kg.`,
          href: `/ventas-conjuntas/${pool.id}/oferta`,
          urgente: true,
        });
      } else if (oferta?.status === "pendiente" && estadoNegociacion(pool)?.lista) {
        avisos.push({
          id: `revision-${oferta.id}`,
          titulo: "Aceptaron todos: el martillero está revisando",
          texto: `«${pool.title}» a ${fmtMoney(Number(oferta.price_per_kg))} por kg. Te avisamos cuando la cierre.`,
          href: `/ventas-conjuntas/${pool.id}`,
          urgente: false,
        });
      }
    } else if (pool.status === "objetivo_alcanzado") {
      avisos.push({
        id: `objetivo-${pool.id}`,
        titulo: "La venta conjunta llegó al objetivo",
        texto: `«${pool.title}» juntó las cabezas. Ahora los compradores pueden ofertar.`,
        href: `/ventas-conjuntas/${pool.id}`,
        urgente: false,
      });
    } else if (pool.status === "cerrado") {
      avisos.push({
        id: `cerrada-${pool.id}`,
        titulo: "Venta cerrada",
        texto: `«${pool.title}» fue cerrada por el martillero. Te escribe por Mensajes para coordinar.`,
        href: `/ventas-conjuntas/${pool.id}`,
        urgente: false,
      });
    }
  }
  return avisos;
}

/** Ventas donde la última oferta es de este comprador. */
export async function ofertasDelComprador(perfil: Profile): Promise<PoolDetail[]> {
  const { data: pools } = await getPools();
  const conOferta = (pools ?? []).filter((p) => ["en_negociacion", "cerrado", "objetivo_alcanzado"].includes(p.status));
  const detalles = await Promise.all(conOferta.map((p) => getPoolDetail(p.id)));
  return detalles
    .map((d) => d.data)
    .filter((d): d is PoolDetail => !!d && d.active_offer?.buyer_id === perfil.id);
}

/** Lotes propios disponibles que el backend aceptaría en esta venta (categoría, zona compatible y que entren). */
export function lotesQueEntran(
  pool: Pick<PoolSummary, "status" | "category" | "zone" | "current_heads" | "target_heads">,
  lotes: LivestockLotWithFarm[]
): LivestockLotWithFarm[] {
  if (pool.status !== "abierto") return [];
  return lotes.filter(
    (l) =>
      l.status === "disponible" &&
      l.category === pool.category &&
      areZonesCompatible(l.farm?.zone, pool.zone) &&
      pool.current_heads + l.head_count <= pool.target_heads
  );
}

export interface Negociacion {
  pool: PoolDetail;
  aceptaron: number;
  productores: number;
  /** Todos los productores aceptaron la oferta: el martillero puede cerrar. */
  lista: boolean;
}

/** Estado de la oferta activa de una venta en negociación (misma cuenta que usa el backend al cerrar). */
export function estadoNegociacion(pool: PoolDetail): Negociacion | null {
  const oferta = pool.active_offer;
  if (pool.status !== "en_negociacion" || !oferta || oferta.status !== "pendiente") return null;
  const productores = new Set(pool.members.map((m) => m.lot?.producer_id).filter(Boolean) as string[]);
  const aceptaron = new Set(
    (oferta.confirmations ?? []).filter((c) => c.accepted && productores.has(c.producer_id)).map((c) => c.producer_id)
  ).size;
  return { pool, aceptaron, productores: productores.size, lista: productores.size > 0 && aceptaron >= productores.size };
}

/** Ventas en negociación con su avance; las listas para cerrar primero. Solo pide el detalle de esas ventas. */
export async function negociacionesDelMartillero(): Promise<Negociacion[]> {
  const { data: pools } = await getPools();
  const enNegociacion = (pools ?? []).filter((p) => p.status === "en_negociacion");
  const detalles = await Promise.all(enNegociacion.map((p) => getPoolDetail(p.id)));
  return detalles
    .map(({ data }) => (data ? estadoNegociacion(data) : null))
    .filter((n): n is Negociacion => n !== null)
    .sort((a, b) => Number(b.lista) - Number(a.lista));
}
