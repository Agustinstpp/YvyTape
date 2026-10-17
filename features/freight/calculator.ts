/**
 * YVYPASS — Freight Simulator Pure Calculation Engine
 * Motor de cálculo paramétrico de fletes ganaderos, comparación individual vs compartido,
 * y distribución proporcional de costos entre productores.
 */

import {
  FreightInput,
  FreightResult,
  FreightComparisonInput,
  FreightComparisonResult,
  ProducerContributionInput,
  ProducerContributionResult,
} from "./types";

/**
 * Calcula el costo total y unitario del flete según la fórmula paramétrica del MVP:
 * totalCost = fixedCost + kilometers * costPerKm + stops * stopSurcharge
 * costPerHead = totalCost / heads
 */
export function calculateFreight(input: FreightInput): FreightResult {
  const safeKm = Math.max(0, input.kilometers || 0);
  const safeStops = Math.max(0, Math.floor(input.stops || 0));
  const safeHeads = Math.max(0, Math.floor(input.heads || 0));
  const safeFixed = Math.max(0, input.fixedCost || 0);
  const safePerKm = Math.max(0, input.costPerKm || 0);
  const safeSurcharge = Math.max(0, input.stopSurcharge || 0);

  const totalCost = safeFixed + safeKm * safePerKm + safeStops * safeSurcharge;

  // Prevención de división por cero
  const costPerHead = safeHeads > 0 ? totalCost / safeHeads : 0;

  const declaredCapacity = input.declaredCapacity;
  const exceedsCapacity = Boolean(
    declaredCapacity && declaredCapacity > 0 && safeHeads > declaredCapacity
  );
  const capacityDifference =
    exceedsCapacity && declaredCapacity ? safeHeads - declaredCapacity : 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    costPerHead: Math.round(costPerHead * 100) / 100,
    exceedsCapacity,
    capacityDifference,
    declaredCapacity,
  };
}

/**
 * Compara dos escenarios de traslado:
 * 1. Traslado Individual: el productor asume el costo completo de su viaje.
 * 2. Traslado Compartido: se prorratea el costo del recorrido conjunto entre las cabezas del pool.
 */
export function compareFreight(
  input: FreightComparisonInput
): FreightComparisonResult {
  const defaultFixed = 100000;
  const defaultPerKm = 1500;
  const defaultSurcharge = 20000;

  const indFixed = input.individual.fixedCost ?? defaultFixed;
  const indPerKm = input.individual.costPerKm ?? defaultPerKm;
  const indSurcharge = input.individual.stopSurcharge ?? defaultSurcharge;
  const indStops = input.individual.stops ?? 0;

  const indRes = calculateFreight({
    kilometers: input.individual.kilometers,
    heads: input.individual.heads,
    stops: indStops,
    fixedCost: indFixed,
    costPerKm: indPerKm,
    stopSurcharge: indSurcharge,
  });

  const sharedFixed = input.shared.fixedCost ?? indFixed;
  const sharedPerKm = input.shared.costPerKm ?? indPerKm;
  const sharedSurcharge = input.shared.stopSurcharge ?? indSurcharge;

  const sharedRes = calculateFreight({
    kilometers: input.shared.kilometers,
    heads: input.shared.totalHeads,
    stops: input.shared.stops,
    fixedCost: sharedFixed,
    costPerKm: sharedPerKm,
    stopSurcharge: sharedSurcharge,
    declaredCapacity: input.shared.declaredCapacity,
  });

  const producerSharedCost =
    Math.round(sharedRes.costPerHead * input.shared.producerHeads * 100) / 100;

  const savingPerHead =
    Math.round((indRes.costPerHead - sharedRes.costPerHead) * 100) / 100;

  const savingTotalForProducer =
    Math.round((indRes.totalCost - producerSharedCost) * 100) / 100;

  // Prevención de división por cero en cálculo de porcentaje
  const savingPercentage =
    indRes.costPerHead > 0
      ? Math.round((savingPerHead / indRes.costPerHead) * 1000) / 10
      : null;

  return {
    individualTotalCost: indRes.totalCost,
    individualCostPerHead: indRes.costPerHead,
    sharedTotalCost: sharedRes.totalCost,
    sharedCostPerHead: sharedRes.costPerHead,
    producerSharedCost,
    savingPerHead,
    savingTotalForProducer,
    savingPercentage,
    isSaving: savingPerHead > 0,
    exceedsCapacity: sharedRes.exceedsCapacity,
  };
}

/**
 * Distribuye proporcionalmente el costo total del flete entre múltiples productores
 * garantizando que la suma de aportes sea exactamente igual al costo total redondeado.
 */
export function distributeFreightCost(
  totalCost: number,
  contributions: ProducerContributionInput[]
): ProducerContributionResult[] {
  const totalHeads = contributions.reduce((acc, c) => acc + Math.max(0, c.heads), 0);

  if (totalHeads <= 0 || totalCost <= 0) {
    return contributions.map((c) => ({
      producerId: c.producerId,
      producerName: c.producerName,
      heads: c.heads,
      percentageOfLoad: 0,
      allocatedCost: 0,
      costPerHead: 0,
    }));
  }

  const roundedTotalCost = Math.round(totalCost);

  // Primer pase: distribución proporcional redondeada a entero
  const results: ProducerContributionResult[] = contributions.map((c) => {
    const safeHeads = Math.max(0, c.heads);
    const percentageOfLoad = (safeHeads / totalHeads) * 100;
    const rawAllocated = (safeHeads / totalHeads) * roundedTotalCost;
    const allocatedCost = Math.round(rawAllocated);
    const costPerHead =
      safeHeads > 0 ? Math.round((allocatedCost / safeHeads) * 100) / 100 : 0;

    return {
      producerId: c.producerId,
      producerName: c.producerName,
      heads: safeHeads,
      percentageOfLoad: Math.round(percentageOfLoad * 10) / 10,
      allocatedCost,
      costPerHead,
    };
  });

  // Reconciliación de redondeo: si hay diferencia de $1 o más, ajustar en el aporte mayor
  const currentSum = results.reduce((acc, r) => acc + r.allocatedCost, 0);
  const diff = roundedTotalCost - currentSum;

  if (diff !== 0 && results.length > 0) {
    // Buscar el índice del productor con mayor cantidad de cabezas
    let maxIdx = 0;
    for (let i = 1; i < results.length; i++) {
      if (results[i].heads > results[maxIdx].heads) {
        maxIdx = i;
      }
    }
    results[maxIdx].allocatedCost += diff;
    if (results[maxIdx].heads > 0) {
      results[maxIdx].costPerHead =
        Math.round((results[maxIdx].allocatedCost / results[maxIdx].heads) * 100) / 100;
    }
  }

  return results;
}

/**
 * Formatea un monto monetario en Pesos Argentinos (ARS) usando formato nacional es-AR.
 */
export function formatCurrencyARS(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return "$ 0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount));
}
