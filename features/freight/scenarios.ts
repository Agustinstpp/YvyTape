/**
 * YVYPASS — Freight Simulator Scenarios
 * Escenarios de prueba y demostración preconfigurados para la Ideathon Corrientes 2026.
 */

import { FreightInput, FreightComparisonInput, ProducerContributionInput } from "./types";

/**
 * Escenario de cálculo base estipulado en el pliego:
 * - Distancia: 200 km
 * - Costo fijo: $100.000
 * - Costo por km: $1.500
 * - Paradas: 2
 * - Recargo por parada: $20.000
 * - Cabezas transportadas: 40
 *
 * Resultado esperado:
 * - Costo total: $440.000
 * - Costo por cabeza: $11.000
 */
export const DEMO_FREIGHT_SCENARIO: FreightInput = {
  kilometers: 200,
  stops: 2,
  heads: 40,
  fixedCost: 100000,
  costPerKm: 1500,
  stopSurcharge: 20000,
  declaredCapacity: 48,
};

/**
 * Escenario de distribución entre 3 productores que consolidan un camión jaula de 40 cabezas:
 * - Productor A: 15 cabezas
 * - Productor B: 10 cabezas
 * - Productor C: 15 cabezas
 */
export const DEMO_PRODUCER_CONTRIBUTIONS: ProducerContributionInput[] = [
  {
    producerId: "prod-a",
    producerName: "Productor A (Establecimiento Don Pedro)",
    heads: 15,
  },
  {
    producerId: "prod-b",
    producerName: "Productor B (Cabaña El Ceibo)",
    heads: 10,
  },
  {
    producerId: "prod-c",
    producerName: "Productor C (Estancia Río Paraná)",
    heads: 15,
  },
];

/**
 * Escenario comparativo individual vs compartido para el Productor A:
 * Individual: traslada sus 15 cabezas solo (180 km, sin paradas intermedias, costo fijo completo).
 * Compartido: participa en el pool de 40 cabezas (200 km, 2 paradas intermedias, costo repartido).
 */
export const DEMO_COMPARISON_SCENARIO: FreightComparisonInput = {
  individual: {
    kilometers: 180,
    heads: 15,
    stops: 0,
    fixedCost: 100000,
    costPerKm: 1500,
    stopSurcharge: 20000,
  },
  shared: {
    kilometers: 200,
    totalHeads: 40,
    producerHeads: 15,
    stops: 2,
    fixedCost: 100000,
    costPerKm: 1500,
    stopSurcharge: 20000,
    declaredCapacity: 48,
  },
};
