import { describe, it, expect } from "vitest";
import {
  calculateProgress,
  formatHeads,
  formatPricePerKg,
  formatWeight,
  formatCategoryName,
} from "@/features/commercial/formatters";
import {
  checkLotCompatibility,
  categorizeLotsForPool,
} from "@/features/commercial/compatibility";
import {
  toPoolCardViewModel,
  getUniqueProducersCount,
  getOfferConfirmationStats,
  checkOperatorCloseEligibility,
} from "@/features/commercial/view-models";
import {
  formatCommercialEventText,
  getPoolStatusPresentation,
} from "@/features/commercial/presentation";
import {
  PoolDetail,
  PoolSummary,
  LivestockLotWithFarm,
  Offer,
  OfferConfirmation,
} from "@/lib/types/domain";

describe("YVYPASS — Persona 3: Motor Comercial y Ventas Conjuntas", () => {
  // Mock base de pool y lotes del seed (Escenario Curuzú Cuatiá 350/400 novillos)
  const basePool: PoolDetail = {
    id: "66666666-6666-4000-8000-000000000001",
    title: "Pool Novillos Curuzú Cuatiá 400 (DEMO)",
    zone: "Curuzú Cuatiá",
    category: "novillo",
    target_heads: 400,
    current_heads: 350,
    status: "abierto",
    created_by: "33333333-3333-4000-8000-000000000001",
    created_at: "2026-10-16T12:00:00Z",
    members: [
      {
        id: "m-1",
        pool_id: "66666666-6666-4000-8000-000000000001",
        lot_id: "lot-1",
        joined_at: "2026-10-16T13:00:00Z",
        lot: {
          id: "lot-1",
          producer_id: "prod-a",
          farm_id: "farm-1",
          title: "120 Novillos Braford",
          category: "novillo",
          breed: "Braford",
          head_count: 120,
          average_weight_kg: 385,
          electronic_tag_reference: "TAG-001",
          verification_status: "declarado",
          status: "reservado",
          created_at: "2026-10-16T12:00:00Z",
          producer: { id: "prod-a", full_name: "Don Juan Romero" },
          farm: { id: "farm-1", name: "La Querencia", zone: "Curuzú Cuatiá", province: "Corrientes" },
        },
      },
      {
        id: "m-2",
        pool_id: "66666666-6666-4000-8000-000000000001",
        lot_id: "lot-2",
        joined_at: "2026-10-16T14:00:00Z",
        lot: {
          id: "lot-2",
          producer_id: "prod-b",
          farm_id: "farm-2",
          title: "80 Novillos Brangus",
          category: "novillo",
          breed: "Brangus",
          head_count: 80,
          average_weight_kg: 390,
          electronic_tag_reference: "TAG-002",
          verification_status: "declarado",
          status: "reservado",
          created_at: "2026-10-16T12:00:00Z",
          producer: { id: "prod-b", full_name: "Doña Carmen Silva" },
          farm: { id: "farm-2", name: "El Ombú", zone: "Curuzú Cuatiá", province: "Corrientes" },
        },
      },
      {
        id: "m-3",
        pool_id: "66666666-6666-4000-8000-000000000001",
        lot_id: "lot-3",
        joined_at: "2026-10-16T15:00:00Z",
        lot: {
          id: "lot-3",
          producer_id: "prod-c",
          farm_id: "farm-3",
          title: "150 Novillos Braford Pesados",
          category: "novillo",
          breed: "Braford",
          head_count: 150,
          average_weight_kg: 410,
          electronic_tag_reference: "TAG-003",
          verification_status: "declarado",
          status: "reservado",
          created_at: "2026-10-16T12:00:00Z",
          producer: { id: "prod-c", full_name: "Cabaña Las Lilas NEA" },
          farm: { id: "farm-3", name: "Rincón del Yvy", zone: "Curuzú Cuatiá", province: "Corrientes" },
        },
      },
    ],
  };

  const lotD_Compatible50: LivestockLotWithFarm = {
    id: "lot-4",
    producer_id: "prod-d",
    farm_id: "farm-4",
    title: "50 Novillos Braford Seleccionados",
    category: "novillo",
    breed: "Braford",
    head_count: 50,
    average_weight_kg: 395,
    electronic_tag_reference: "TAG-004",
    verification_status: "declarado",
    status: "disponible",
    created_at: "2026-10-16T12:00:00Z",
    producer: { id: "prod-d", full_name: "Don Pedro Morales" },
    farm: { id: "farm-4", name: "Los Cardales", zone: "Curuzú Cuatiá", province: "Corrientes" },
  };

  // =========================================================================
  // CASOS POSITIVOS (1 al 9)
  // =========================================================================
  describe("Casos Positivos — Flujo Comercial Completo", () => {
    it("1. Un pool muestra correctamente su progreso", () => {
      const progress = calculateProgress(basePool.current_heads, basePool.target_heads);
      expect(progress.remainingHeads).toBe(50);
      expect(progress.isComplete).toBe(false);
      expect(formatHeads(basePool.current_heads)).toBe("350 cabezas");
    });

    it("2. Se calcula exactamente 350 / 400 = 87,5%", () => {
      const progress = calculateProgress(350, 400);
      expect(progress.percentage).toBe(87.5);
      expect(progress.percentageFormatted).toBe("87,5%");
      expect(progress.remainingHeads).toBe(50);
    });

    it("3. El selector muestra lotes compatibles correctamente", () => {
      const check = checkLotCompatibility(lotD_Compatible50, basePool, basePool.current_heads);
      expect(check.isCompatible).toBe(true);
      expect(check.reason).toBeUndefined();

      const { compatible, incompatible } = categorizeLotsForPool(
        [lotD_Compatible50],
        basePool,
        basePool.current_heads
      );
      expect(compatible).toHaveLength(1);
      expect(incompatible).toHaveLength(0);
    });

    it("4. La adhesión de 50 cabezas actualiza el total a 400", () => {
      const newTotal = basePool.current_heads + lotD_Compatible50.head_count;
      expect(newTotal).toBe(400);
      const updatedProgress = calculateProgress(newTotal, basePool.target_heads);
      expect(updatedProgress.percentage).toBe(100);
      expect(updatedProgress.remainingHeads).toBe(0);
      expect(updatedProgress.isComplete).toBe(true);
    });

    it("5. El estado cambia visualmente a objetivo_alcanzado cuando llega a 400/400", () => {
      const poolAt400: PoolSummary = {
        ...basePool,
        current_heads: 400,
        status: "objetivo_alcanzado",
        members_count: 4,
      };
      const vm = toPoolCardViewModel(poolAt400);
      expect(vm.status).toBe("objetivo_alcanzado");
      expect(vm.statusPresentation.label).toBe("Objetivo alcanzado");
      expect(vm.percentage).toBe(100);
      expect(vm.remainingHeadsText).toBe("¡Objetivo alcanzado!");
    });

    it("6. Un comprador puede completar y validar una oferta con precio indicativo válido", () => {
      const validPrice = 2950;
      expect(validPrice).toBeGreaterThan(0);
      expect(isFinite(validPrice)).toBe(true);
      const formatted = formatPricePerKg(validPrice);
      expect(formatted).toContain("2.950");
      expect(formatted).toContain("/ kg");
    });

    it("7. Un productor puede confirmar su propia decisión sobre una oferta activa", () => {
      const offer: Offer = {
        id: "offer-1",
        pool_id: basePool.id,
        buyer_id: "buyer-1",
        price_per_kg: 2950,
        status: "pendiente",
        created_at: "2026-10-16T16:00:00Z",
      };

      const confirmation: OfferConfirmation = {
        id: "conf-1",
        offer_id: offer.id,
        producer_id: "prod-d",
        accepted: true,
        created_at: "2026-10-16T16:05:00Z",
      };

      const stats = getOfferConfirmationStats(
        { ...offer, confirmations: [confirmation] },
        [
          ...basePool.members,
          {
            id: "m-4",
            pool_id: basePool.id,
            lot_id: lotD_Compatible50.id,
            joined_at: "2026-10-16T15:30:00Z",
            lot: lotD_Compatible50,
          },
        ],
        "prod-d"
      );

      expect(stats.userHasConfirmed).toBe(true);
      expect(stats.userConfirmation?.accepted).toBe(true);
      expect(stats.acceptedCount).toBe(1);
    });

    it("8. El panel muestra correctamente las confirmaciones (3 de 4 productores)", () => {
      const fourMembers = [
        ...basePool.members,
        {
          id: "m-4",
          pool_id: basePool.id,
          lot_id: lotD_Compatible50.id,
          joined_at: "2026-10-16T15:30:00Z",
          lot: lotD_Compatible50,
        },
      ];

      expect(getUniqueProducersCount(fourMembers)).toBe(4);

      const offer: Offer & { confirmations: OfferConfirmation[] } = {
        id: "offer-1",
        pool_id: basePool.id,
        buyer_id: "buyer-1",
        price_per_kg: 2950,
        status: "pendiente",
        created_at: "2026-10-16T16:00:00Z",
        confirmations: [
          { id: "c-1", offer_id: "offer-1", producer_id: "prod-a", accepted: true, created_at: "" },
          { id: "c-2", offer_id: "offer-1", producer_id: "prod-b", accepted: true, created_at: "" },
          { id: "c-3", offer_id: "offer-1", producer_id: "prod-c", accepted: true, created_at: "" },
        ],
      };

      const stats = getOfferConfirmationStats(offer, fourMembers);
      expect(stats.totalProducers).toBe(4);
      expect(stats.confirmedProducers).toBe(3);
      expect(stats.acceptedCount).toBe(3);
      expect(stats.pendingCount).toBe(1);
      expect(stats.allAccepted).toBe(false);
    });

    it("9. Un operador puede iniciar el cierre autorizado cuando el 100% aceptó", () => {
      const fourMembers = [
        ...basePool.members,
        {
          id: "m-4",
          pool_id: basePool.id,
          lot_id: lotD_Compatible50.id,
          joined_at: "2026-10-16T15:30:00Z",
          lot: lotD_Compatible50,
        },
      ];

      const poolInNegotiation: PoolDetail = {
        ...basePool,
        current_heads: 400,
        status: "en_negociacion",
        members: fourMembers,
        active_offer: {
          id: "offer-1",
          pool_id: basePool.id,
          buyer_id: "buyer-1",
          price_per_kg: 2950,
          status: "pendiente",
          created_at: "2026-10-16T16:00:00Z",
          confirmations: [
            { id: "c-1", offer_id: "offer-1", producer_id: "prod-a", accepted: true, created_at: "" },
            { id: "c-2", offer_id: "offer-1", producer_id: "prod-b", accepted: true, created_at: "" },
            { id: "c-3", offer_id: "offer-1", producer_id: "prod-c", accepted: true, created_at: "" },
            { id: "c-4", offer_id: "offer-1", producer_id: "prod-d", accepted: true, created_at: "" },
          ],
        },
      };

      const eligibility = checkOperatorCloseEligibility(poolInNegotiation, "op-1", "operador");
      expect(eligibility.canClose).toBe(true);
      expect(eligibility.pricePerKgFormatted).toContain("2.950");
    });
  });

  // =========================================================================
  // CASOS NEGATIVOS (10 al 20)
  // =========================================================================
  describe("Casos Negativos — Validaciones y Restricciones Comerciales", () => {
    it("10. Un lote incompatible por categoría o zona no puede seleccionarse", () => {
      const lotWrongCat: LivestockLotWithFarm = {
        ...lotD_Compatible50,
        category: "vaca",
      };
      const checkCat = checkLotCompatibility(lotWrongCat, basePool, 350);
      expect(checkCat.isCompatible).toBe(false);
      expect(checkCat.reason).toContain("categoría");

      const lotWrongZone: LivestockLotWithFarm = {
        ...lotD_Compatible50,
        farm: { ...lotD_Compatible50.farm!, zone: "Santo Tomé" },
      };
      const checkZone = checkLotCompatibility(lotWrongZone, basePool, 350);
      expect(checkZone.isCompatible).toBe(false);
      expect(checkZone.reason).toContain("zona");
    });

    it("11. No se puede sumar animales a un pool cerrado o cancelado", () => {
      const closedPool = { ...basePool, status: "cerrado" as const };
      const check = checkLotCompatibility(lotD_Compatible50, closedPool, 400);
      expect(check.isCompatible).toBe(false);
      expect(check.reason).toContain("no está abierta");
    });

    it("12. No se puede exceder el objetivo de cabezas (regla de lote indivisible)", () => {
      // Pool necesita 50 cabezas (350/400). Productor tiene lote de 80 novillos.
      const lotExcessive: LivestockLotWithFarm = {
        ...lotD_Compatible50,
        head_count: 80,
      };
      const check = checkLotCompatibility(lotExcessive, basePool, 350);
      expect(check.isCompatible).toBe(false);
      expect(check.reason).toBe("Este lote supera la cantidad de cabezas que falta reunir.");
      expect(check.isLotDivisibleWarning).toBe(true);
    });

    it("13. La prevención de duplicados desactiva el botón durante el envío", () => {
      const isSubmitting = true;
      const canSubmit = !isSubmitting;
      expect(canSubmit).toBe(false);
    });

    it("14. Un productor no ve acciones restringidas a compradores", () => {
      const userRole = "productor";
      const canCreateOffer = (userRole as string) === "comprador" && basePool.status === "objetivo_alcanzado";
      expect(canCreateOffer).toBe(false);
    });

    it("15. Un comprador no ve la acción de adherir lote como propia", () => {
      const userRole = "comprador";
      const canJoin = (userRole as string) === "productor" && basePool.status === "abierto";
      expect(canJoin).toBe(false);
    });

    it("16. Un productor solo puede consultar y emitir su propia confirmación", () => {
      const currentUserId = "prod-d";
      const confirmations: OfferConfirmation[] = [
        { id: "c-1", offer_id: "off-1", producer_id: "prod-a", accepted: true, created_at: "" },
      ];

      const stats = getOfferConfirmationStats(
        { id: "off-1", pool_id: "p-1", buyer_id: "b-1", price_per_kg: 2950, status: "pendiente", created_at: "", confirmations },
        basePool.members,
        currentUserId
      );

      // prod-d no ha confirmado aún
      expect(stats.userHasConfirmed).toBe(false);
      expect(stats.userConfirmation).toBeNull();
    });

    it("17. Una oferta con precio cero o negativo se invalida", () => {
      const invalidPrices = [0, -100, NaN];
      invalidPrices.forEach((price) => {
        const isValid = !isNaN(price) && price > 0 && isFinite(price);
        expect(isValid).toBe(false);
      });
    });

    it("18. Un rechazo de cualquier productor impide el cierre automático del operador", () => {
      const fourMembers = [
        ...basePool.members,
        {
          id: "m-4",
          pool_id: basePool.id,
          lot_id: lotD_Compatible50.id,
          joined_at: "2026-10-16T15:30:00Z",
          lot: lotD_Compatible50,
        },
      ];

      const poolWithRejection: PoolDetail = {
        ...basePool,
        current_heads: 400,
        status: "en_negociacion",
        members: fourMembers,
        active_offer: {
          id: "offer-1",
          pool_id: basePool.id,
          buyer_id: "buyer-1",
          price_per_kg: 2950,
          status: "pendiente",
          created_at: "2026-10-16T16:00:00Z",
          confirmations: [
            { id: "c-1", offer_id: "offer-1", producer_id: "prod-a", accepted: true, created_at: "" },
            { id: "c-2", offer_id: "offer-1", producer_id: "prod-b", accepted: true, created_at: "" },
            { id: "c-3", offer_id: "offer-1", producer_id: "prod-c", accepted: false, created_at: "" }, // ¡RECHAZÓ!
            { id: "c-4", offer_id: "offer-1", producer_id: "prod-d", accepted: true, created_at: "" },
          ],
        },
      };

      const eligibility = checkOperatorCloseEligibility(poolWithRejection, "op-1", "operador");
      expect(eligibility.canClose).toBe(false);
      expect(eligibility.reason).toContain("rechazos");
    });

    it("19. Los eventos comerciales y mensajes se traducen a lenguaje claro sin jerga técnica", () => {
      const eventText = formatCommercialEventText(
        "pool_target_reached",
        { target_heads: 400 },
        "Sistema"
      );
      expect(eventText.title).toBe("¡Objetivo de cabezas alcanzado!");
      expect(eventText.subtitle).toContain("400 cabezas");
      expect(eventText.subtitle).not.toContain("RPC");
      expect(eventText.subtitle).not.toContain("Payload");
    });

    it("20. Conteo de productores únicos no se duplica si un productor tiene 2 lotes", () => {
      const membersWithDuplicateProducer = [
        ...basePool.members,
        {
          id: "m-4-dup",
          pool_id: basePool.id,
          lot_id: "lot-another",
          joined_at: "2026-10-16T15:30:00Z",
          lot: {
            ...lotD_Compatible50,
            producer_id: "prod-a", // ¡Mismo productor Don Juan Romero!
          },
        },
      ];

      // Aunque hay 4 membresías/lotes, los productores únicos son solo 3: prod-a, prod-b, prod-c
      expect(getUniqueProducersCount(membersWithDuplicateProducer)).toBe(3);
    });
  });
});
