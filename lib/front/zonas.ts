/**
 * Localidades: usa el catálogo público de features/geography/zones.ts (de geografía, sin modificarlo)
 * para que todos escriban la zona igual y las ventas conjuntas coincidan.
 */
import { CORRIENTES_ZONES, normalizeZoneKey } from "@/features/geography/zones";

export const ZONAS: string[] = Array.from(new Set(Object.values(CORRIENTES_ZONES).map((z) => z.name))).sort((a, b) =>
  a.localeCompare(b, "es")
);

/** Devuelve el nombre del catálogo si coincide ("curuzu cuatia" → "Curuzú Cuatiá"); si no, el texto limpio. */
export function canonZona(texto: string): string {
  const t = texto.trim().replace(/\s+/g, " ");
  const k = normalizeZoneKey(t);
  return ZONAS.find((z) => normalizeZoneKey(z) === k) ?? t;
}

/** Compara dos localidades sin importar mayúsculas, tildes ni espacios. */
export function mismaZona(a?: string | null, b?: string | null): boolean {
  return !!a && !!b && normalizeZoneKey(a) === normalizeZoneKey(b);
}
