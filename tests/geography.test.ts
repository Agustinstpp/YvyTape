import { describe, it, expect } from "vitest";
import { filterOffers, calculateMapSummary } from "@/features/geography/filters";
import { DEMO_MAP_OFFERS, mapLotToOffer, mapPoolToOffer } from "@/features/geography/queries";
import { getZoneCoordinates, normalizeZoneKey, CORRIENTES_MAP_CENTER } from "@/features/geography/zones";
import {
  normalizePhoneNumber,
  buildWhatsAppLink,
  buildShareLink,
  createPoolInquiryMessage,
  createSharePoolMessage,
} from "@/lib/utils/whatsapp";
import { LivestockLotWithFarm, PoolSummary } from "@/lib/types/domain";

describe("Módulo A — Geografía y Filtros de Mapa", () => {
  describe("1. Filtros de ofertas en el mapa", () => {
    it("filtra únicamente pools de venta", () => {
      const filtered = filterOffers(DEMO_MAP_OFFERS, { type: "pool" });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((o) => o.type === "pool")).toBe(true);
    });

    it("filtra únicamente lotes individuales", () => {
      const filtered = filterOffers(DEMO_MAP_OFFERS, { type: "lote" });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((o) => o.type === "lote")).toBe(true);
    });

    it("filtra por zona ganadera (ej: Mercedes)", () => {
      const filtered = filterOffers(DEMO_MAP_OFFERS, { zone: "Mercedes" });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((o) => o.zone.toLowerCase() === "mercedes")).toBe(true);
    });

    it("filtra por categoría ganadera (ej: novillo)", () => {
      const filtered = filterOffers(DEMO_MAP_OFFERS, { category: "novillo" });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((o) => o.category === "novillo")).toBe(true);
    });

    it("filtra por cantidad mínima de cabezas", () => {
      const filtered = filterOffers(DEMO_MAP_OFFERS, { minHeads: 100 });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((o) => o.headCount >= 100)).toBe(true);
    });

    it("retorna lista vacía si ningún elemento cumple criterios exigentes", () => {
      const filtered = filterOffers(DEMO_MAP_OFFERS, { minHeads: 10000 });
      expect(filtered).toHaveLength(0);
    });
  });

  describe("2. Resumen estadístico del mapa", () => {
    it("calcula totales correctos de cabezas, lotes y pools", () => {
      const summary = calculateMapSummary(DEMO_MAP_OFFERS);
      expect(summary.totalOffers).toBe(DEMO_MAP_OFFERS.length);
      expect(summary.totalHeads).toBeGreaterThan(0);
      expect(summary.lotsCount + summary.poolsCount).toBe(DEMO_MAP_OFFERS.length);
      expect(summary.zonesRepresented).toBeGreaterThan(0);
    });
  });

  describe("3. Privacidad y zonas públicas autorizadas", () => {
    it("retorna coordenadas oficiales de centroides públicos para Mercedes, Curuzú Cuatiá y Goya", () => {
      const mercedes = getZoneCoordinates("Mercedes");
      expect(mercedes.latitude).toBeCloseTo(-29.1842, 3);
      expect(mercedes.longitude).toBeCloseTo(-58.0752, 3);

      const curuzu = getZoneCoordinates("Curuzú Cuatiá");
      expect(curuzu.latitude).toBeCloseTo(-29.7917, 3);

      const goya = getZoneCoordinates("Goya");
      expect(goya.latitude).toBeCloseTo(-29.1442, 3);
    });

    it("normaliza variantes de texto de zonas", () => {
      expect(normalizeZoneKey("Curuzú Cuatiá")).toBe("curuzu_cuatia");
      expect(normalizeZoneKey("  MERCEDES  ")).toBe("mercedes");
    });

    it("mapea un lote a MapOffer utilizando la zona pública y sin exponer coordenadas privadas", () => {
      const mockLot: LivestockLotWithFarm = {
        id: "lot-test-1",
        producer_id: "prod-secret-id",
        farm_id: "farm-secret-id",
        title: "50 Novillos",
        category: "novillo",
        breed: "Braford",
        head_count: 50,
        average_weight_kg: 380,
        electronic_tag_reference: null,
        verification_status: "declarado",
        status: "disponible",
        created_at: new Date().toISOString(),
        farm: {
          id: "farm-secret-id",
          name: "Campo La Escondida Privado",
          zone: "Mercedes",
          province: "Corrientes",
        },
      };

      const offer = mapLotToOffer(mockLot);

      expect(offer.type).toBe("lote");
      expect(offer.zone).toBe("Mercedes");
      // Verifica que las coordenadas están en el entorno de Mercedes y no son arbitrarias
      expect(offer.latitude).toBeCloseTo(-29.18, 1);
      expect(offer.longitude).toBeCloseTo(-58.07, 1);
      // No debe contener campos privados como farm_id o producer_id crudos
      expect((offer as any).producer_id).toBeUndefined();
      expect((offer as any).farm_id).toBeUndefined();
    });

    it("mapea un pool a MapOffer con cabezas dinámicas", () => {
      const mockPool: PoolSummary = {
        id: "pool-test-1",
        title: "Pool Novillos 400",
        zone: "Corrientes Centro",
        category: "novillo",
        target_heads: 400,
        status: "abierto",
        created_by: "op-1",
        created_at: new Date().toISOString(),
        current_heads: 350,
        members_count: 3,
      };

      const offer = mapPoolToOffer(mockPool);
      expect(offer.type).toBe("pool");
      expect(offer.headCount).toBe(350);
      expect(offer.targetHeads).toBe(400);
      expect(offer.detailUrl).toBe("/pools/pool-test-1");
    });
  });
});

describe("Módulo C — WhatsApp y Comunicación", () => {
  describe("1. Normalización de teléfonos", () => {
    it("normaliza celular local argentino sin código de país (10 dígitos)", () => {
      const normalized = normalizePhoneNumber("3794123456");
      expect(normalized).toBe("5493794123456");
    });

    it("normaliza número argentino con cero inicial (03794123456)", () => {
      const normalized = normalizePhoneNumber("03794123456");
      expect(normalized).toBe("5493794123456");
    });

    it("normaliza número con formato visual (+54 9 379 412-3456)", () => {
      const normalized = normalizePhoneNumber("+54 9 379 412-3456");
      expect(normalized).toBe("5493794123456");
    });

    it("agrega el 9 móvil si el número tiene 54 pero le falta el 9", () => {
      const normalized = normalizePhoneNumber("543794123456");
      expect(normalized).toBe("5493794123456");
    });

    it("retorna null si el teléfono es inválido o demasiado corto", () => {
      expect(normalizePhoneNumber("123")).toBeNull();
      expect(normalizePhoneNumber("")).toBeNull();
    });
  });

  describe("2. Generación de enlaces wa.me", () => {
    it("construye un enlace wa.me directo y codificado", () => {
      const link = buildWhatsAppLink("3794123456", "Hola, me interesa el pool.");
      expect(link).toContain("https://wa.me/5493794123456?text=");
      expect(link).toContain("Hola%2C%20me%20interesa%20el%20pool.");
    });

    it("retorna cadena vacía si el teléfono es inválido para evitar enlaces rotos", () => {
      const link = buildWhatsAppLink("invalido", "Hola");
      expect(link).toBe("");
    });

    it("genera enlace para compartir sin destinatario", () => {
      const shareLink = buildShareLink("¡Mirá este pool en YvyPass!");
      expect(shareLink).toContain("https://wa.me/?text=");
      expect(shareLink).toContain("%C2%A1Mir%C3%A1%20este%20pool");
    });

    it("construye mensaje comercial de consulta de pool con link de retorno", () => {
      const msg = createPoolInquiryMessage({
        poolTitle: "Pool Novillos NEA 400",
        zone: "Mercedes",
        detailUrl: "/pools/123",
      });

      expect(msg).toContain("Pool Novillos NEA 400");
      expect(msg).toContain("Mercedes");
      expect(msg).toContain("https://yvypass.vercel.app/pools/123");
    });

    it("construye mensaje para compartir convocatoria de pool", () => {
      const msg = createSharePoolMessage({
        poolTitle: "Pool Novillos NEA 400",
        zone: "Mercedes",
        currentHeads: 350,
        targetHeads: 400,
        detailUrl: "/pools/123",
      });

      expect(msg).toContain("350/400");
      expect(msg).toContain("flete compartido");
    });
  });
});
