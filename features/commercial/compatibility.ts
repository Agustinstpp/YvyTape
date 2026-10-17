import { LivestockLotWithFarm, SalesPool, PoolStatus } from "@/lib/types/domain";
import { areZonesCompatible } from "@/features/geography/zones";

export interface LotCompatibilityResult {
  isCompatible: boolean;
  reason?: string;
  isLotDivisibleWarning?: boolean;
}

/**
 * Evalúa si un lote de ganado puede incorporarse a una venta conjunta específica.
 * Implementa las reglas comerciales y mensajes de orientación para el productor.
 */
export function checkLotCompatibility(
  lot: LivestockLotWithFarm,
  pool: {
    category: string;
    zone: string;
    target_heads: number;
    status: PoolStatus;
  },
  currentHeads: number
): LotCompatibilityResult {
  // 1. Estado del pool
  if (pool.status !== "abierto") {
    return {
      isCompatible: false,
      reason: "La venta conjunta ya no acepta animales porque no está abierta.",
    };
  }

  // 2. Estado del lote
  if (lot.status !== "disponible") {
    if (lot.status === "reservado") {
      return {
        isCompatible: false,
        reason: "Este lote ya participa en otra venta conjunta.",
      };
    }
    if (lot.status === "vendido") {
      return {
        isCompatible: false,
        reason: "Este lote ya fue vendido.",
      };
    }
    return {
      isCompatible: false,
      reason: `El lote no está disponible (estado actual: ${lot.status}).`,
    };
  }

  // 3. Compatibilidad de Categoría
  if (lot.category !== pool.category) {
    return {
      isCompatible: false,
      reason: `La categoría del lote (${lot.category}) no coincide con la venta conjunta (${pool.category}).`,
    };
  }

  // 4. Compatibilidad de Zona (misma zona o zona cercana compatible)
  if (!areZonesCompatible(lot.farm?.zone, pool.zone)) {
    return {
      isCompatible: false,
      reason: `La zona del lote (${lot.farm?.zone || "Sin zona"}) no coincide ni es compatible con la venta conjunta (${pool.zone}).`,
    };
  }

  // 5. Capacidad restante y regla de lote indivisible
  const remainingHeads = Math.max(0, pool.target_heads - currentHeads);

  if (lot.head_count > remainingHeads) {
    return {
      isCompatible: false,
      reason: "Este lote supera la cantidad de cabezas que falta reunir.",
      isLotDivisibleWarning: true,
    };
  }

  if (lot.head_count <= 0) {
    return {
      isCompatible: false,
      reason: "La cantidad de animales debe ser mayor a cero.",
    };
  }

  // Cumple con todas las condiciones
  return {
    isCompatible: true,
  };
}

/**
 * Filtra y categoriza una lista de lotes en compatibles e incompatibles con sus motivos.
 */
export function categorizeLotsForPool(
  lots: LivestockLotWithFarm[],
  pool: {
    category: string;
    zone: string;
    target_heads: number;
    status: PoolStatus;
  },
  currentHeads: number
) {
  const compatible: { lot: LivestockLotWithFarm }[] = [];
  const incompatible: { lot: LivestockLotWithFarm; reason: string }[] = [];

  for (const lot of lots) {
    const check = checkLotCompatibility(lot, pool, currentHeads);
    if (check.isCompatible) {
      compatible.push({ lot });
    } else {
      incompatible.push({ lot, reason: check.reason || "Lote no compatible." });
    }
  }

  return { compatible, incompatible };
}
