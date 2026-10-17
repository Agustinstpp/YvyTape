import { describe, it, expect } from "vitest";
import {
  calculateFreight,
  compareFreight,
  distributeFreightCost,
} from "@/features/freight/calculator";
import { ProducerContributionInput } from "@/features/freight/types";

describe("Fase 4 — Integración del Simulador de Flete con Datos Reales de Venta Conjunta", () => {
  it("calcula costos proporcionales exactos según las cabezas aportadas por cada productor", () => {
    // Escenario real de la venta conjunta Curuzú Cuatiá (350 novillos entre 3 productores):
    // Productor A: 120 cabezas
    // Productor B: 80 cabezas
    // Productor C: 150 cabezas
    const contributions: ProducerContributionInput[] = [
      { producerId: "prod-a", producerName: "Don Juan Romero", heads: 120 },
      { producerId: "prod-b", producerName: "Doña Carmen Silva", heads: 80 },
      { producerId: "prod-c", producerName: "Cabaña Las Lilas NEA", heads: 150 },
    ];

    const totalHeads = 120 + 80 + 150; // 350
    expect(totalHeads).toBe(350);

    const freightInput = {
      kilometers: 200,
      stops: 2, // 2 paradas intermedias
      heads: totalHeads,
      fixedCost: 200000,
      costPerKm: 1500,
      stopSurcharge: 50000,
      declaredCapacity: 350,
    };

    const freightResult = calculateFreight(freightInput);
    // Costo = fixed (200k) + km (200 * 1500 = 300k) + paradas (2 * 50k = 100k) = 600,000
    expect(freightResult.totalCost).toBe(600000);
    expect(freightResult.costPerHead).toBeCloseTo(600000 / 350, 2);

    const distributed = distributeFreightCost(freightResult.totalCost, contributions);

    expect(distributed).toHaveLength(3);

    // Verificación de proporcionalidad
    const prodA = distributed.find((d) => d.producerId === "prod-a")!;
    const prodB = distributed.find((d) => d.producerId === "prod-b")!;
    const prodC = distributed.find((d) => d.producerId === "prod-c")!;

    expect(prodA.percentageOfLoad).toBeCloseTo((120 / 350) * 100, 1);
    expect(prodB.percentageOfLoad).toBeCloseTo((80 / 350) * 100, 1);
    expect(prodC.percentageOfLoad).toBeCloseTo((150 / 350) * 100, 1);

    // Suma de costos asignados es igual al costo total del flete
    const totalAllocated = prodA.allocatedCost + prodB.allocatedCost + prodC.allocatedCost;
    expect(totalAllocated).toBeCloseTo(freightResult.totalCost, 0);

    // Costo por cabeza es idéntico y equitativo para todos los participantes
    expect(prodA.costPerHead).toBeCloseTo(freightResult.costPerHead, 1);
    expect(prodB.costPerHead).toBeCloseTo(freightResult.costPerHead, 1);
    expect(prodC.costPerHead).toBeCloseTo(freightResult.costPerHead, 1);
  });

  it("demuestra el ahorro significativo del flete compartido respecto al flete individual", () => {
    // Productor pequeño con 80 cabezas contratando un viaje propio vs sumándose al pool
    const comparison = compareFreight({
      individual: {
        kilometers: 200,
        heads: 80,
        stops: 0,
        fixedCost: 200000,
        costPerKm: 1500,
      },
      shared: {
        kilometers: 200,
        totalHeads: 350,
        producerHeads: 80,
        stops: 2,
        fixedCost: 200000,
        costPerKm: 1500,
        stopSurcharge: 50000,
        declaredCapacity: 350,
      },
    });

    expect(comparison.isSaving).toBe(true);
    expect(comparison.savingTotalForProducer).toBeGreaterThan(0);
    expect(comparison.producerSharedCost).toBeLessThan(comparison.individualTotalCost);
  });
});
