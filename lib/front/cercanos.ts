/**
 * "Completá la caravana": productores cercanos con lotes disponibles de la misma categoría.
 * Usa las coordenadas públicas por localidad de features/geography/zones.ts (nunca la ubicación del campo).
 */
import { getZoneCoordinates } from "@/features/geography/zones";
import type { LivestockLotWithFarm, PoolDetail } from "@/lib/types/domain";
import { areZonesCompatible, mismaZona } from "@/lib/front/zonas";

export const RADIO_KM = 75;

export interface Cercano {
  zona: string;
  cabezas: number;
  km: number;
  lotes: { id: string; cabezas: number }[];
  mismaZona: boolean;
  /** Posición relativa al centro en km (este +, norte +). */
  dx: number;
  dy: number;
}

function km(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const r = (g: number) => (g * Math.PI) / 180;
  const h = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLon - aLon) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Desplazamiento en km de una localidad respecto de otra (aprox. plano local). */
export function offsetKm(desde: string, hasta: string) {
  const a = getZoneCoordinates(desde);
  const b = getZoneCoordinates(hasta);
  const dx = (b.longitude - a.longitude) * 111.32 * Math.cos((a.latitude * Math.PI) / 180);
  const dy = (b.latitude - a.latitude) * 110.57;
  return { dx, dy, km: km(a.latitude, a.longitude, b.latitude, b.longitude) };
}

/** Agrupa por localidad los lotes disponibles de otros productores dentro del radio. */
export function cercanosPara(venta: PoolDetail, disponibles: LivestockLotWithFarm[], miId: string): Cercano[] {
  const enVenta = new Set(venta.members.map((m) => m.lot_id));
  const porZona = new Map<string, Cercano>();
  for (const l of disponibles) {
    if (l.producer_id === miId || enVenta.has(l.id) || l.category !== venta.category) continue;
    const zona = l.farm?.zone;
    // Solo zonas que el backend acepta para sumarse (are_zones_compatible)
    if (!zona || !areZonesCompatible(zona, venta.zone)) continue;
    const o = offsetKm(venta.zone, zona);
    const key = zona.toLowerCase();
    const c = porZona.get(key) ?? { zona, cabezas: 0, km: Math.round(o.km), lotes: [], mismaZona: mismaZona(zona, venta.zone), dx: o.dx, dy: o.dy };
    c.cabezas += l.head_count;
    c.lotes.push({ id: l.id, cabezas: l.head_count });
    porZona.set(key, c);
  }
  return [...porZona.values()].sort((a, b) => a.km - b.km);
}

/** Los más cercanos que alcanzan para completar lo que falta. */
export function masCercanosQueCompletan(cercanos: Cercano[], faltan: number): Cercano[] {
  const elegidos: Cercano[] = [];
  let suma = 0;
  for (const c of cercanos) {
    if (suma >= faltan) break;
    elegidos.push(c);
    suma += c.cabezas;
  }
  return suma >= faltan ? elegidos : [];
}

/** Lotes disponibles de otros productores que el backend aceptaría en esta venta. */
export function lotesCompatibles(venta: PoolDetail, disponibles: LivestockLotWithFarm[], miId: string): LivestockLotWithFarm[] {
  const enVenta = new Set(venta.members.map((m) => m.lot_id));
  return disponibles.filter(
    (l) => l.producer_id !== miId && !enVenta.has(l.id) && l.category === venta.category && areZonesCompatible(l.farm?.zone, venta.zone)
  );
}
