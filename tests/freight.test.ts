import { describe, it, expect } from "vitest";
import {
  calculateFreight,
  compareFreight,
  distributeFreightCost,
  formatCurrencyARS,
} from "@/features/freight/calculator";
import { freightInputSchema } from "@/features/freight/validators";
import { DEMO_FREIGHT_SCENARIO, DEMO_PRODUCER_CONTRIBUTIONS } from "@/features/freight/scenarios";

describe("Módulo B — Simulador de Flete Ganadero", () => {
  describe("1. Fórmula paramétrica de costo", () => {
    it("calcula con exactitud el escenario de referencia del pliego (200km, 40 cabezas, 2 paradas)", () => {
      const result = calculateFreight(DEMO_FREIGHT_SCENARIO);

      // Fijo: 100.000 + (200 * 1.500) + (2 * 20.000) = 100.000 + 300.000 + 40.000 = 440.000
      expect(result.totalCost).toBe(440000);
      // Por cabeza: 440.000 / 40 = 11.000
      expect(result.costPerHead).toBe(11000);
      expect(result.exceedsCapacity).toBe(false);
      expect(result.capacityDifference).toBe(0);
    });

    it("previene división por cero cuando la cantidad de animales es 0", () => {
      const result = calculateFreight({
        kilometers: 100,
        stops: 1,
        heads: 0,
        fixedCost: 50000,
        costPerKm: 1000,
        stopSurcharge: 10000,
      });

      expect(result.totalCost).toBe(160000);
      expect(result.costPerHead).toBe(0);
      expect(Number.isFinite(result.costPerHead)).toBe(true);
    });

    it("maneja distancias de 0 km cobrando únicamente costo fijo y paradas", () => {
      const result = calculateFreight({
        kilometers: 0,
        stops: 1,
        heads: 10,
        fixedCost: 50000,
        costPerKm: 1500,
        stopSurcharge: 15000,
      });

      expect(result.totalCost).toBe(65000);
      expect(result.costPerHead).toBe(6500);
    });
  });

  describe("2. Capacidad del vehículo", () => {
    it("advierte y calcula el exceso cuando la carga supera la capacidad declarada", () => {
      const result = calculateFreight({
        kilometers: 200,
        stops: 0,
        heads: 55,
        fixedCost: 100000,
        costPerKm: 1500,
        stopSurcharge: 0,
        declaredCapacity: 48,
      });

      expect(result.exceedsCapacity).toBe(true);
      expect(result.capacityDifference).toBe(7);
    });

    it("no activa advertencia cuando la carga está dentro de la capacidad declarada", () => {
      const result = calculateFreight({
        kilometers: 200,
        stops: 0,
        heads: 48,
        fixedCost: 100000,
        costPerKm: 1500,
        stopSurcharge: 0,
        declaredCapacity: 48,
      });

      expect(result.exceedsCapacity).toBe(false);
      expect(result.capacityDifference).toBe(0);
    });
  });

  describe("3. Comparación Individual vs Compartido", () => {
    it("detecta ahorro positivo cuando compartir camión reduce el costo por cabeza", () => {
      const comparison = compareFreight({
        individual: {
          kilometers: 200,
          heads: 15,
          stops: 0,
          fixedCost: 100000,
          costPerKm: 1500,
          stopSurcharge: 20000,
        },
        shared: {
          kilometers: 220,
          totalHeads: 45,
          producerHeads: 15,
          stops: 2,
          fixedCost: 100000,
          costPerKm: 1500,
          stopSurcharge: 20000,
        },
      });

      // Individual: 100.000 + 300.000 = 400.000 total / 15 = 26.666,67 por cabeza
      // Compartido: 100.000 + 330.000 + 40.000 = 470.000 / 45 = 10.444,44 por cabeza
      expect(comparison.isSaving).toBe(true);
      expect(comparison.savingPerHead).toBeGreaterThan(0);
      expect(comparison.savingTotalForProducer).toBeGreaterThan(0);
      expect(comparison.savingPercentage).toBeGreaterThan(50);
    });

    it("detecta sobrecosto (ahorro negativo) cuando el viaje compartido resulta más oneroso", () => {
      const comparison = compareFreight({
        individual: {
          kilometers: 50,
          heads: 40,
          stops: 0,
          fixedCost: 50000,
          costPerKm: 1000,
          stopSurcharge: 10000,
        },
        shared: {
          kilometers: 500, // Gran desvío de kilómetros
          totalHeads: 45,
          producerHeads: 40,
          stops: 6, // Muchas paradas
          fixedCost: 100000,
          costPerKm: 1500,
          stopSurcharge: 25000,
        },
      });

      expect(comparison.isSaving).toBe(false);
      expect(comparison.savingPerHead).toBeLessThan(0);
      expect(comparison.savingPercentage).toBeLessThan(0);
    });
  });

  describe("4. Distribución proporcional de costos entre productores", () => {
    it("distribuye el costo total de $440.000 exactamente entre los 3 productores de demo", () => {
      const totalCost = 440000;
      const contributions = distributeFreightCost(totalCost, DEMO_PRODUCER_CONTRIBUTIONS);

      expect(contributions).toHaveLength(3);

      // Productor A: 15/40 = 37.5% -> $165.000
      expect(contributions[0].heads).toBe(15);
      expect(contributions[0].percentageOfLoad).toBe(37.5);
      expect(contributions[0].allocatedCost).toBe(165000);
      expect(contributions[0].costPerHead).toBe(11000);

      // Productor B: 10/40 = 25% -> $110.000
      expect(contributions[1].heads).toBe(10);
      expect(contributions[1].percentageOfLoad).toBe(25);
      expect(contributions[1].allocatedCost).toBe(110000);
      expect(contributions[1].costPerHead).toBe(11000);

      // Productor C: 15/40 = 37.5% -> $165.000
      expect(contributions[2].heads).toBe(15);
      expect(contributions[2].allocatedCost).toBe(165000);

      // Verificación de suma exacta
      const sum = contributions.reduce((acc, c) => acc + c.allocatedCost, 0);
      expect(sum).toBe(totalCost);
    });

    it("reconcilia diferencias de redondeo con centavos o números impares", () => {
      const totalCost = 100001; // Impar
      const contributions = [
        { producerId: "1", producerName: "Prod 1", heads: 3 },
        { producerId: "2", producerName: "Prod 2", heads: 3 },
      ];
      const results = distributeFreightCost(totalCost, contributions);
      const sum = results.reduce((acc, r) => acc + r.allocatedCost, 0);
      expect(sum).toBe(100001);
    });
  });

  describe("5. Validación Zod de entradas (freightInputSchema)", () => {
    it("acepta parámetros válidos", () => {
      const result = freightInputSchema.safeParse(DEMO_FREIGHT_SCENARIO);
      expect(result.success).toBe(true);
    });

    it("rechaza kilómetros negativos", () => {
      const result = freightInputSchema.safeParse({
        ...DEMO_FREIGHT_SCENARIO,
        kilometers: -50,
      });
      expect(result.success).toBe(false);
    });

    it("rechaza paradas con decimales o negativas", () => {
      const resultDec = freightInputSchema.safeParse({
        ...DEMO_FREIGHT_SCENARIO,
        stops: 2.5,
      });
      expect(resultDec.success).toBe(false);

      const resultNeg = freightInputSchema.safeParse({
        ...DEMO_FREIGHT_SCENARIO,
        stops: -1,
      });
      expect(resultNeg.success).toBe(false);
    });

    it("rechaza cabezas <= 0", () => {
      const resultZero = freightInputSchema.safeParse({
        ...DEMO_FREIGHT_SCENARIO,
        heads: 0,
      });
      expect(resultZero.success).toBe(false);
    });
  });

  describe("6. Formato de Moneda Argentina (es-AR)", () => {
    it("formatea correctamente cifras monetarias en ARS", () => {
      const formatted = formatCurrencyARS(440000);
      expect(formatted).toContain("440.000");
      expect(formatted).toContain("$");
    });
  });
});
