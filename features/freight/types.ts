/**
 * YVYPASS — Freight Simulator Types
 * Definición de tipos para cálculo logístico, comparación y distribución de costos.
 */

export interface FreightInput {
  kilometers: number;
  stops: number;
  heads: number;
  fixedCost: number;
  costPerKm: number;
  stopSurcharge: number;
  declaredCapacity?: number;
}

export interface FreightResult {
  totalCost: number;
  costPerHead: number;
  exceedsCapacity: boolean;
  capacityDifference: number;
  declaredCapacity?: number;
}

export interface FreightComparisonInput {
  individual: {
    kilometers: number;
    heads: number;
    stops?: number;
    fixedCost?: number;
    costPerKm?: number;
    stopSurcharge?: number;
  };
  shared: {
    kilometers: number;
    totalHeads: number;
    producerHeads: number;
    stops: number;
    fixedCost?: number;
    costPerKm?: number;
    stopSurcharge?: number;
    declaredCapacity?: number;
  };
}

export interface FreightComparisonResult {
  individualTotalCost: number;
  individualCostPerHead: number;
  sharedTotalCost: number;
  sharedCostPerHead: number;
  producerSharedCost: number;
  savingPerHead: number;
  savingTotalForProducer: number;
  savingPercentage: number | null;
  isSaving: boolean;
  exceedsCapacity: boolean;
}

export interface ProducerContributionInput {
  producerId: string;
  producerName: string;
  heads: number;
}

export interface ProducerContributionResult {
  producerId: string;
  producerName: string;
  heads: number;
  percentageOfLoad: number;
  allocatedCost: number;
  costPerHead: number;
}
