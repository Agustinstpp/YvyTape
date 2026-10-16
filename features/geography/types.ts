/**
 * YVYPASS — Geography & Map Types
 * Tipos de datos para visualización geográfica y capas de mapa.
 *
 * REGLA DE PRIVACIDAD: Las coordenadas deben ser zonales/públicas aproximadas.
 * NUNCA se deben exponer coordenadas exactas de establecimientos o corrales.
 */

import { LivestockCategory, LotStatus, PoolStatus } from "@/lib/types/domain";

export interface ZoneCoordinates {
  name: string;
  department: string;
  province: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

export type OfferType = "lote" | "pool";

export interface MapOffer {
  id: string;
  type: OfferType;
  title: string;
  zone: string;
  province: string;
  category: LivestockCategory;
  breed?: string;
  headCount: number;
  latitude: number;
  longitude: number;
  detailUrl: string;
  status: LotStatus | PoolStatus;
  averageWeightKg?: number;
  targetHeads?: number; // Exclusivo de pools
  currentHeads?: number; // Exclusivo de pools (calculado dinámicamente)
  producerName?: string; // Nombre de fantasía o comercial autorizado
}

export interface MapFiltersState {
  type: "all" | "lote" | "pool";
  zone: string;
  category: string; // "all" o LivestockCategory
  breed: string;
  minHeads: number;
  status: string; // "all" o estado específico
}

export interface MapSummaryStats {
  totalOffers: number;
  totalHeads: number;
  lotsCount: number;
  poolsCount: number;
  zonesRepresented: number;
}
