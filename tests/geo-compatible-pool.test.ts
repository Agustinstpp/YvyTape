import { describe, it, expect } from "vitest";
import { areZonesCompatible, calculateZoneDistanceKm } from "@/features/geography/zones";
import { checkLotCompatibility } from "@/features/commercial/compatibility";
import { LivestockLotWithFarm } from "@/lib/types/domain";

describe("Fase 3 — Compatibilidad Geográfica Controlada entre Zonas Cercanas", () => {
  it("reconoce como compatibles a localidades ganaderas cercanas en el radio operativo", () => {
    // Curuzú Cuatiá y Mercedes (~68 km)
    expect(areZonesCompatible("Curuzú Cuatiá", "Mercedes")).toBe(true);
    expect(areZonesCompatible("mercedes", "curuzu_cuatia")).toBe(true);

    // Curuzú Cuatiá y Monte Caseros (~65 km)
    expect(areZonesCompatible("Curuzú Cuatiá", "Monte Caseros")).toBe(true);

    // Goya y Bella Vista (~74 km)
    expect(areZonesCompatible("Goya", "Bella Vista")).toBe(true);

    // Santo Tomé y Virasoro (~56 km)
    expect(areZonesCompatible("Santo Tomé", "Gobernador Virasoro")).toBe(true);

    // Misma zona siempre es compatible
    expect(areZonesCompatible("Curuzú Cuatiá", "Curuzú Cuatiá")).toBe(true);
  });

  it("rechaza localidades lejanas que superan el límite de transporte conjunto", () => {
    // Curuzú Cuatiá y Santo Tomé (>240 km)
    expect(areZonesCompatible("Curuzú Cuatiá", "Santo Tomé")).toBe(false);

    // Curuzú Cuatiá e Ituzaingó (>260 km)
    expect(areZonesCompatible("Curuzú Cuatiá", "Ituzaingó")).toBe(false);

    // Goya y Santo Tomé (>300 km)
    expect(areZonesCompatible("Goya", "Santo Tomé")).toBe(false);
  });

  it("calcula distancias consistentes con el catálogo de coordenadas públicas", () => {
    const distCuruzuMercedes = calculateZoneDistanceKm("Curuzú Cuatiá", "Mercedes");
    expect(distCuruzuMercedes).toBeGreaterThan(60);
    expect(distCuruzuMercedes).toBeLessThan(75);

    const distMisma = calculateZoneDistanceKm("Curuzú Cuatiá", "Curuzú Cuatiá");
    expect(distMisma).toBe(0);
  });

  it("permite que un lote de una localidad compatible (Mercedes) participe en un pool de Curuzú Cuatiá", () => {
    const poolCuruzu = {
      category: "novillo",
      zone: "Curuzú Cuatiá",
      target_heads: 400,
      status: "abierto" as const,
    };

    const lotFromMercedes: LivestockLotWithFarm = {
      id: "lot-mercedes-1",
      producer_id: "prod-mercedes",
      farm_id: "farm-mercedes",
      title: "50 Novillos Mercedes",
      category: "novillo",
      breed: "Braford",
      head_count: 50,
      average_weight_kg: 390,
      electronic_tag_reference: null,
      verification_status: "declarado",
      status: "disponible",
      created_at: new Date().toISOString(),
      farm: {
        id: "farm-mercedes",
        name: "Estancia El Payubreró",
        zone: "Mercedes",
        province: "Corrientes",
      },
    };

    const result = checkLotCompatibility(lotFromMercedes, poolCuruzu, 350);
    expect(result.isCompatible).toBe(true);
  });

  it("rechaza la adhesión de un lote de una localidad lejana incompatible (Santo Tomé) en un pool de Curuzú Cuatiá", () => {
    const poolCuruzu = {
      category: "novillo",
      zone: "Curuzú Cuatiá",
      target_heads: 400,
      status: "abierto" as const,
    };

    const lotFromSantoTome: LivestockLotWithFarm = {
      id: "lot-st-1",
      producer_id: "prod-st",
      farm_id: "farm-st",
      title: "50 Novillos Santo Tomé",
      category: "novillo",
      breed: "Braford",
      head_count: 50,
      average_weight_kg: 390,
      electronic_tag_reference: null,
      verification_status: "declarado",
      status: "disponible",
      created_at: new Date().toISOString(),
      farm: {
        id: "farm-st",
        name: "Campo La Cruz",
        zone: "Santo Tomé",
        province: "Corrientes",
      },
    };

    const result = checkLotCompatibility(lotFromSantoTome, poolCuruzu, 350);
    expect(result.isCompatible).toBe(false);
    expect(result.reason).toContain("no coincide ni es compatible");
  });
});
