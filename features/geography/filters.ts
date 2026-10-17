/**
 * YVYPASS — Geography Filter Logic
 * Funciones puras para filtrado y resumen estadístico de ofertas en el mapa.
 */

import { MapOffer, MapFiltersState, MapSummaryStats } from "./types";

export const INITIAL_MAP_FILTERS: MapFiltersState = {
  type: "all",
  zone: "all",
  category: "all",
  breed: "all",
  minHeads: 0,
  status: "all",
};

/**
 * Filtra las ofertas del mapa según los criterios seleccionados por el usuario.
 */
export function filterOffers(
  offers: MapOffer[],
  filters: Partial<MapFiltersState>
): MapOffer[] {
  const mergedFilters: MapFiltersState = {
    ...INITIAL_MAP_FILTERS,
    ...filters,
  };

  return offers.filter((offer) => {
    // 1. Filtro por tipo (lote o pool)
    if (mergedFilters.type !== "all" && offer.type !== mergedFilters.type) {
      return false;
    }

    // 2. Filtro por zona
    if (
      mergedFilters.zone &&
      mergedFilters.zone !== "all" &&
      offer.zone.toLowerCase() !== mergedFilters.zone.toLowerCase()
    ) {
      return false;
    }

    // 3. Filtro por categoría ganadera
    if (
      mergedFilters.category &&
      mergedFilters.category !== "all" &&
      offer.category !== mergedFilters.category
    ) {
      return false;
    }

    // 4. Filtro por raza
    if (
      mergedFilters.breed &&
      mergedFilters.breed !== "all" &&
      offer.breed?.toLowerCase() !== mergedFilters.breed.toLowerCase()
    ) {
      return false;
    }

    // 5. Filtro por mínimo de cabezas
    if (
      mergedFilters.minHeads > 0 &&
      offer.headCount < mergedFilters.minHeads
    ) {
      return false;
    }

    // 6. Filtro por estado comercial
    if (
      mergedFilters.status &&
      mergedFilters.status !== "all" &&
      offer.status !== mergedFilters.status
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Calcula estadísticas y métricas acumuladas de las ofertas visibles en el mapa.
 */
export function calculateMapSummary(offers: MapOffer[]): MapSummaryStats {
  const zonesSet = new Set<string>();
  let totalHeads = 0;
  let lotsCount = 0;
  let poolsCount = 0;

  for (const offer of offers) {
    if (offer.zone) {
      zonesSet.add(offer.zone);
    }
    totalHeads += offer.headCount || 0;
    if (offer.type === "lote") {
      lotsCount++;
    } else if (offer.type === "pool") {
      poolsCount++;
    }
  }

  return {
    totalOffers: offers.length,
    totalHeads,
    lotsCount,
    poolsCount,
    zonesRepresented: zonesSet.size,
  };
}
