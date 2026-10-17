import {
  PoolDetail,
  PoolSummary,
  PoolMemberDetail,
  Offer,
  OfferConfirmation,
  UserRole,
} from "@/lib/types/domain";
import { calculateProgress, formatHeads, formatCategoryName, formatPricePerKg } from "./formatters";
import { getPoolStatusPresentation, PoolStatusPresentation } from "./presentation";

export interface PoolCardViewModel {
  id: string;
  title: string;
  zone: string;
  category: string;
  categoryFormatted: string;
  currentHeads: number;
  targetHeads: number;
  currentHeadsFormatted: string;
  targetHeadsFormatted: string;
  percentage: number;
  percentageFormatted: string;
  remainingHeads: number;
  remainingHeadsText: string;
  status: PoolSummary["status"];
  statusPresentation: PoolStatusPresentation;
  membersCount: number;
}

export function toPoolCardViewModel(pool: PoolSummary | PoolDetail): PoolCardViewModel {
  const progress = calculateProgress(pool.current_heads, pool.target_heads);
  const statusPresentation = getPoolStatusPresentation(pool.status);

  return {
    id: pool.id,
    title: pool.title,
    zone: pool.zone,
    category: pool.category,
    categoryFormatted: formatCategoryName(pool.category),
    currentHeads: pool.current_heads,
    targetHeads: pool.target_heads,
    currentHeadsFormatted: formatHeads(pool.current_heads),
    targetHeadsFormatted: formatHeads(pool.target_heads),
    percentage: progress.percentage,
    percentageFormatted: progress.percentageFormatted,
    remainingHeads: progress.remainingHeads,
    remainingHeadsText:
      progress.remainingHeads > 0
        ? `Faltan ${formatHeads(progress.remainingHeads)} para alcanzar el objetivo`
        : "¡Objetivo alcanzado!",
    status: pool.status,
    statusPresentation,
    membersCount: "members_count" in pool ? pool.members_count : pool.members?.length || 0,
  };
}

/**
 * Cuenta la cantidad de productores únicos que participan en un pool.
 * Un productor con varios lotes adheridos cuenta como un único participante.
 */
export function getUniqueProducersCount(members: PoolMemberDetail[] = []): number {
  const uniqueProducerIds = new Set<string>();
  for (const member of members) {
    const producerId = member.lot?.producer_id || member.lot?.producer?.id;
    if (producerId) {
      uniqueProducerIds.add(producerId);
    }
  }
  return uniqueProducerIds.size;
}

/**
 * Obtiene la lista de IDs de productores únicos en el pool.
 */
export function getUniqueProducerIds(members: PoolMemberDetail[] = []): string[] {
  const unique = new Set<string>();
  for (const m of members) {
    const id = m.lot?.producer_id || m.lot?.producer?.id;
    if (id) unique.add(id);
  }
  return Array.from(unique);
}

export interface OfferConfirmationStats {
  totalProducers: number;
  confirmedProducers: number;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  allAccepted: boolean;
  hasRejections: boolean;
  userConfirmation: OfferConfirmation | null;
  userHasConfirmed: boolean;
  progressPercent: number;
}

/**
 * Analiza las confirmaciones de una oferta en relación a los productores miembros del pool.
 */
export function getOfferConfirmationStats(
  offer: (Offer & { confirmations?: OfferConfirmation[] }) | null | undefined,
  members: PoolMemberDetail[] = [],
  currentUserId?: string
): OfferConfirmationStats {
  const producerIds = getUniqueProducerIds(members);
  const totalProducers = producerIds.length;

  if (!offer || !offer.confirmations) {
    return {
      totalProducers,
      confirmedProducers: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      pendingCount: totalProducers,
      allAccepted: false,
      hasRejections: false,
      userConfirmation: null,
      userHasConfirmed: false,
      progressPercent: 0,
    };
  }

  // Filtrar confirmaciones únicas por productor
  const confirmationsByProducer = new Map<string, OfferConfirmation>();
  for (const conf of offer.confirmations) {
    confirmationsByProducer.set(conf.producer_id, conf);
  }

  let acceptedCount = 0;
  let rejectedCount = 0;

  for (const prodId of producerIds) {
    const conf = confirmationsByProducer.get(prodId);
    if (conf) {
      if (conf.accepted) acceptedCount++;
      else rejectedCount++;
    }
  }

  const confirmedProducers = acceptedCount + rejectedCount;
  const pendingCount = Math.max(0, totalProducers - confirmedProducers);
  const allAccepted = totalProducers > 0 && acceptedCount === totalProducers && rejectedCount === 0;
  const hasRejections = rejectedCount > 0;

  const userConfirmation = currentUserId ? confirmationsByProducer.get(currentUserId) || null : null;
  const userHasConfirmed = userConfirmation !== null;

  const progressPercent =
    totalProducers > 0 ? Math.round((confirmedProducers / totalProducers) * 100) : 0;

  return {
    totalProducers,
    confirmedProducers,
    acceptedCount,
    rejectedCount,
    pendingCount,
    allAccepted,
    hasRejections,
    userConfirmation,
    userHasConfirmed,
    progressPercent,
  };
}

export interface OperatorCloseEligibility {
  canClose: boolean;
  reason?: string;
  pricePerKgFormatted?: string;
  totalHeads: number;
}

/**
 * Valida si el pool cumple todas las condiciones necesarias para que un operador ejecute el cierre demostrativo.
 */
export function checkOperatorCloseEligibility(
  pool: PoolDetail,
  currentUserId?: string,
  userRole?: UserRole
): OperatorCloseEligibility {
  if (userRole !== "operador") {
    return {
      canClose: false,
      reason: "Solo usuarios con rol de operador comercial pueden realizar el cierre.",
      totalHeads: pool.current_heads,
    };
  }

  if (pool.status !== "en_negociacion") {
    return {
      canClose: false,
      reason: `El pool no está en estado de negociación (estado actual: ${pool.status}).`,
      totalHeads: pool.current_heads,
    };
  }

  if (!pool.active_offer || pool.active_offer.status !== "pendiente") {
    return {
      canClose: false,
      reason: "No hay una oferta activa pendiente para este pool.",
      totalHeads: pool.current_heads,
    };
  }

  const stats = getOfferConfirmationStats(pool.active_offer, pool.members, currentUserId);

  if (stats.hasRejections) {
    return {
      canClose: false,
      reason: "La propuesta tiene rechazos de productores. Requiere renegociación.",
      totalHeads: pool.current_heads,
    };
  }

  if (!stats.allAccepted) {
    return {
      canClose: false,
      reason: `Faltan confirmaciones: ${stats.acceptedCount} de ${stats.totalProducers} productores aceptaron la propuesta.`,
      totalHeads: pool.current_heads,
    };
  }

  return {
    canClose: true,
    pricePerKgFormatted: formatPricePerKg(pool.active_offer.price_per_kg),
    totalHeads: pool.current_heads,
  };
}
