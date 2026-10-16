import { describe, it, expect } from "vitest";
import { createLotSchema, updateLotSchema } from "@/lib/validators/lots";
import { createPoolSchema, joinPoolSchema } from "@/lib/validators/pools";
import { createOfferSchema, confirmOfferSchema } from "@/lib/validators/offers";

describe("Validadores Zod — YvyPass", () => {
  describe("Lotes Ganaderos (createLotSchema)", () => {
    it("acepta un lote ganadero con datos válidos", () => {
      const validLot = {
        farm_id: "44444444-4444-4000-8000-000000000001",
        title: "120 Novillos Braford Marca Líquida",
        category: "novillo",
        breed: "Braford",
        head_count: 120,
        average_weight_kg: 385.5,
        electronic_tag_reference: "TAG-CC-001",
      };
      const result = createLotSchema.safeParse(validLot);
      expect(result.success).toBe(true);
    });

    it("rechaza lote con head_count <= 0", () => {
      const invalidLot = {
        farm_id: "44444444-4444-4000-8000-000000000001",
        title: "Novillos prueba",
        category: "novillo",
        breed: "Braford",
        head_count: 0,
        average_weight_kg: 350,
      };
      const result = createLotSchema.safeParse(invalidLot);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("mayor a 0");
      }
    });

    it("rechaza lote con peso promedio <= 0", () => {
      const invalidLot = {
        farm_id: "44444444-4444-4000-8000-000000000001",
        title: "Novillos prueba",
        category: "novillo",
        breed: "Braford",
        head_count: 50,
        average_weight_kg: -10,
      };
      const result = createLotSchema.safeParse(invalidLot);
      expect(result.success).toBe(false);
    });

    it("rechaza categoría ganadera inexistente", () => {
      const invalidLot = {
        farm_id: "44444444-4444-4000-8000-000000000001",
        title: "Novillos prueba",
        category: "categoria_falsa",
        breed: "Braford",
        head_count: 50,
        average_weight_kg: 350,
      };
      const result = createLotSchema.safeParse(invalidLot);
      expect(result.success).toBe(false);
    });

    it("rechaza farm_id que no sea UUID", () => {
      const invalidLot = {
        farm_id: "no-es-un-uuid",
        title: "Novillos prueba",
        category: "novillo",
        breed: "Braford",
        head_count: 50,
        average_weight_kg: 350,
      };
      const result = createLotSchema.safeParse(invalidLot);
      expect(result.success).toBe(false);
    });
  });

  describe("Pools de Venta (createPoolSchema, joinPoolSchema)", () => {
    it("acepta un pool con datos válidos", () => {
      const validPool = {
        title: "Pool Novillos Curuzú Cuatiá 400",
        zone: "Curuzú Cuatiá",
        category: "novillo",
        target_heads: 400,
      };
      const result = createPoolSchema.safeParse(validPool);
      expect(result.success).toBe(true);
    });

    it("rechaza pool con target_heads <= 0", () => {
      const invalidPool = {
        title: "Pool Inválido",
        zone: "Curuzú Cuatiá",
        category: "novillo",
        target_heads: 0,
      };
      const result = createPoolSchema.safeParse(invalidPool);
      expect(result.success).toBe(false);
    });

    it("valida IDs correctos al adherirse a un pool", () => {
      const validJoin = {
        pool_id: "66666666-6666-4000-8000-000000000001",
        lot_id: "55555555-5555-4000-8000-000000000004",
      };
      const result = joinPoolSchema.safeParse(validJoin);
      expect(result.success).toBe(true);
    });

    it("rechaza join con UUIDs inválidos", () => {
      const invalidJoin = {
        pool_id: "invalido",
        lot_id: "invalido",
      };
      const result = joinPoolSchema.safeParse(invalidJoin);
      expect(result.success).toBe(false);
    });
  });

  describe("Ofertas Comerciales (createOfferSchema, confirmOfferSchema)", () => {
    it("acepta oferta con precio positivo", () => {
      const result = createOfferSchema.safeParse({ price_per_kg: 2850.5 });
      expect(result.success).toBe(true);
    });

    it("rechaza oferta con precio 0 o negativo", () => {
      const result = createOfferSchema.safeParse({ price_per_kg: 0 });
      expect(result.success).toBe(false);
    });

    it("valida confirmación de productor con booleano explícito", () => {
      const result = confirmOfferSchema.safeParse({
        offer_id: "77777777-7777-4000-8000-000000000001",
        accepted: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
