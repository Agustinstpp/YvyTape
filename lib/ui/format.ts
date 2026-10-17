import type {
  LivestockCategory,
  LotStatus,
  PoolStatus,
  UserRole,
} from "@/lib/types/domain";

export const CATEGORIES: LivestockCategory[] = [
  "ternero",
  "ternera",
  "novillo",
  "vaquillona",
  "vaca",
  "toro",
];

const CATEGORY_LABEL: Record<LivestockCategory, [string, string]> = {
  ternero: ["Ternero", "Terneros"],
  ternera: ["Ternera", "Terneras"],
  novillo: ["Novillo", "Novillos"],
  vaquillona: ["Vaquillona", "Vaquillonas"],
  vaca: ["Vaca", "Vacas"],
  toro: ["Toro", "Toros"],
};

export function categoryLabel(category: LivestockCategory, plural = true): string {
  return CATEGORY_LABEL[category]?.[plural ? 1 : 0] ?? category;
}

/** "13 terneros", "1 novillo" */
export function heads(count: number, category?: LivestockCategory): string {
  if (!category) return `${fmtInt(count)} ${count === 1 ? "cabeza" : "cabezas"}`;
  return `${fmtInt(count)} ${categoryLabel(category, count !== 1).toLowerCase()}`;
}

export const LOT_STATUS_LABEL: Record<LotStatus, string> = {
  disponible: "Disponible",
  reservado: "En una venta conjunta",
  vendido: "Vendido",
};

export const POOL_STATUS_LABEL: Record<PoolStatus, string> = {
  abierto: "Juntando cabezas",
  objetivo_alcanzado: "Completa: esperando ofertas",
  en_negociacion: "Oferta recibida",
  cerrado: "Venta cerrada",
  cancelado: "Cancelada",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  productor: "Productor",
  comprador: "Comprador",
  operador: "Martillero YvyTape",
};

const intFmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const moneyFmt = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function fmtInt(n: number): string {
  return intFmt.format(n);
}

export function fmtMoney(n: number): string {
  return `$ ${moneyFmt.format(n)}`;
}

export function fmtKg(n: number): string {
  return `${intFmt.format(n)} kg`;
}

export function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
  const day = (x: Date) => x.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
  if (day(d) === day(now)) return `Hoy, ${time}`;
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (day(d) === day(yesterday)) return `Ayer, ${time}`;
  return `${d.toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "America/Argentina/Buenos_Aires" })}, ${time}`;
}

export function percent(current: number, target: number): number {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}
