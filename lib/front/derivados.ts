/**
 * Datos que arman las pantallas a partir de los servicios que ya existen en el
 * backend (sin tablas nuevas): ventas donde participa el productor, avisos y
 * ofertas del comprador.
 */
import { getMyLots } from "@/features/lots/queries";
import { getPools, getPoolDetail } from "@/features/pools/queries";
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
        texto: `«${pool.title}» se cerró. El martillero se comunica por Mensajes.`,
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
