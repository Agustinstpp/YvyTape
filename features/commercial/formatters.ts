import { LivestockCategory } from "@/lib/types/domain";

/**
 * Cálculos y formateadores del motor comercial de YvyPass.
 * Diseñado con énfasis en accesibilidad y legibilidad para productores ganaderos.
 */

export interface ProgressCalculation {
  percentage: number;
  percentageFormatted: string;
  remainingHeads: number;
  isComplete: boolean;
}

/**
 * Calcula el progreso de cabezas de un pool.
 * Asegura que target_heads sea > 0 y evita superar el 100% visualmente.
 */
export function calculateProgress(
  currentHeads: number,
  targetHeads: number
): ProgressCalculation {
  const safeCurrent = Math.max(0, currentHeads || 0);
  const safeTarget = Math.max(1, targetHeads || 1);

  const rawPercent = (safeCurrent / safeTarget) * 100;
  // Redondear a 1 decimal para precisión (ej: 87.5%)
  const roundedPercent = Math.min(100, Math.round(rawPercent * 10) / 10);
  const remaining = Math.max(0, safeTarget - safeCurrent);

  return {
    percentage: roundedPercent,
    percentageFormatted: `${roundedPercent.toLocaleString("es-AR", {
      minimumFractionDigits: roundedPercent % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    })}%`,
    remainingHeads: remaining,
    isComplete: safeCurrent >= safeTarget,
  };
}

/**
 * Formatea cantidades de animales usando términos del sector ganadero.
 * Ejemplo: "400 cabezas" o "1 cabeza".
 */
export function formatHeads(count: number): string {
  const safeCount = Math.max(0, count || 0);
  return `${safeCount.toLocaleString("es-AR")} ${safeCount === 1 ? "cabeza" : "cabezas"}`;
}

/**
 * Formato de moneda para precio indicativo por kg en pesos argentinos.
 * Ejemplo: "$ 2.950 / kg"
 */
export function formatPricePerKg(price: number): string {
  if (isNaN(price) || price <= 0) return "$ 0 / kg";
  return `${price.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  })} / kg`;
}

/**
 * Formatea moneda estándar.
 * Ejemplo: "$ 1.250.000"
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount <= 0) return "$ 0";
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

/**
 * Formatea peso en kilogramos.
 * Ejemplo: "385 kg"
 */
export function formatWeight(kg: number): string {
  if (isNaN(kg) || kg <= 0) return "0 kg";
  return `${Math.round(kg).toLocaleString("es-AR")} kg`;
}

/**
 * Formatea fechas a horario y formato legible en Argentina.
 */
export function formatCommercialDate(dateString: string | null | undefined): string {
  if (!dateString) return "Fecha no disponible";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha no disponible";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes} hs`;
  } catch {
    return "Fecha no disponible";
  }
}

/**
 * Diccionario de categorías ganaderas con su denominación en español correcto.
 */
export const CATEGORY_LABELS: Record<LivestockCategory, string> = {
  ternero: "Ternero",
  ternera: "Ternera",
  novillo: "Novillo",
  vaquillona: "Vaquillona",
  vaca: "Vaca",
  toro: "Toro",
};

export function formatCategoryName(category: LivestockCategory | string): string {
  return CATEGORY_LABELS[category as LivestockCategory] || category;
}
