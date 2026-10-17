/**
 * YVYPASS — Geography Queries & Adapters
 * Adaptador para transformar lotes y pools (contratos de Persona 1)
 * en el modelo seguro de presentación geográfica MapOffer.
 */

import { MapOffer } from "./types";
import { getZoneCoordinates, getDispersedCoordinates } from "./zones";
import { LivestockLotWithFarm, PoolSummary } from "@/lib/types/domain";

/**
 * Datos de demostración estructurados para Ideathon Corrientes 2026.
 * Incluye el escenario obligatorio del Pool de 350 a 400 Novillos en Corrientes Centro/Mercedes.
 */
export const DEMO_MAP_OFFERS: MapOffer[] = [
  // Pool Demostrativo Principal
  {
    id: "pool-novillos-nea-400",
    type: "pool",
    title: "Pool Novillos NEA 400 (Venta Conjunta)",
    zone: "Mercedes",
    province: "Corrientes",
    category: "novillo",
    breed: "Braford / Brangus",
    headCount: 350,
    targetHeads: 400,
    currentHeads: 350,
    status: "abierto",
    latitude: -29.1842,
    longitude: -58.0752,
    detailUrl: "/pools/pool-novillos-nea-400",
    producerName: "Pool Colaborativo (3 Productores Adheridos)",
  },
  // Lote Demostrativo del Productor D (el que completa el pool de 350 a 400)
  {
    id: "lote-productor-d-50",
    type: "lote",
    title: "50 Novillos Braford para Exportación / Pool",
    zone: "Mercedes",
    province: "Corrientes",
    category: "novillo",
    breed: "Braford",
    headCount: 50,
    averageWeightKg: 390,
    status: "disponible",
    latitude: -29.201,
    longitude: -58.058,
    detailUrl: "/lotes/lote-productor-d-50",
    producerName: "Establecimiento Don Pedro",
  },
  // Otros Lotes y Pools representativos en zonas de Corrientes
  {
    id: "pool-terneros-curuzu-200",
    type: "pool",
    title: "Pool Terneros Livianos Curuzú Cuatiá",
    zone: "Curuzú Cuatiá",
    province: "Corrientes",
    category: "ternero",
    breed: "Brangus Negro",
    headCount: 160,
    targetHeads: 200,
    currentHeads: 160,
    status: "abierto",
    latitude: -29.7917,
    longitude: -58.0549,
    detailUrl: "/pools/pool-terneros-curuzu-200",
    producerName: "Pool Zona Sur Corrientes",
  },
  {
    id: "lote-vaquillonas-goya-80",
    type: "lote",
    title: "80 Vaquillonas Preñadas Calidad Superior",
    zone: "Goya",
    province: "Corrientes",
    category: "vaquillona",
    breed: "Braford",
    headCount: 80,
    averageWeightKg: 340,
    status: "disponible",
    latitude: -29.1442,
    longitude: -59.2652,
    detailUrl: "/lotes/lote-vaquillonas-goya-80",
    producerName: "Cabaña Río Paraná",
  },
  {
    id: "lote-terneras-santo-tome-110",
    type: "lote",
    title: "110 Terneras para Recría Zona Río Uruguay",
    zone: "Santo Tomé",
    province: "Corrientes",
    category: "ternera",
    breed: "Brangus Colorado",
    headCount: 110,
    averageWeightKg: 195,
    status: "disponible",
    latitude: -28.5494,
    longitude: -56.0408,
    detailUrl: "/lotes/lote-terneras-santo-tome-110",
    producerName: "Estancia El Ceibo",
  },
  {
    id: "pool-vacas-libres-250",
    type: "pool",
    title: "Pool Vacas Invernada Paso de los Libres",
    zone: "Paso de los Libres",
    province: "Corrientes",
    category: "vaca",
    breed: "Cruza Británica",
    headCount: 250,
    targetHeads: 250,
    currentHeads: 250,
    status: "objetivo_alcanzado",
    latitude: -29.7125,
    longitude: -57.0883,
    detailUrl: "/pools/pool-vacas-libres-250",
    producerName: "Consorcio Frontera",
  },
  {
    id: "lote-toros-bella-vista-15",
    type: "lote",
    title: "15 Toros Reproductores Registrados",
    zone: "Bella Vista",
    province: "Corrientes",
    category: "toro",
    breed: "Brangus",
    headCount: 15,
    averageWeightKg: 680,
    status: "disponible",
    latitude: -28.5085,
    longitude: -59.0437,
    detailUrl: "/lotes/lote-toros-bella-vista-15",
    producerName: "Genética Correntina",
  },
  {
    id: "lote-novillos-esquina-95",
    type: "lote",
    title: "95 Novillos Pesados Terminados a Pasto",
    zone: "Esquina",
    province: "Corrientes",
    category: "novillo",
    breed: "Braford",
    headCount: 95,
    averageWeightKg: 420,
    status: "disponible",
    latitude: -30.0144,
    longitude: -59.5306,
    detailUrl: "/lotes/lote-novillos-esquina-95",
    producerName: "Establecimiento Las Marías del Sur",
  },
];

/**
 * Convierte un lote ganadero de la BD en un MapOffer seguro.
 * Protege la privacidad aplicando únicamente coordenadas zonales públicas autorizadas.
 */
export function mapLotToOffer(lot: LivestockLotWithFarm): MapOffer {
  const zoneName = lot.farm?.zone || "Corrientes Centro";
  const baseCoords = getZoneCoordinates(zoneName);
  const coords = getDispersedCoordinates(
    baseCoords.latitude,
    baseCoords.longitude,
    lot.id
  );

  return {
    id: lot.id,
    type: "lote",
    title: lot.title,
    zone: baseCoords.name,
    province: lot.farm?.province || "Corrientes",
    category: lot.category,
    breed: lot.breed,
    headCount: lot.head_count,
    averageWeightKg: lot.average_weight_kg,
    status: lot.status,
    latitude: coords.latitude,
    longitude: coords.longitude,
    detailUrl: `/lotes/${lot.id}`,
    producerName: lot.producer?.full_name || "Productor Verificado",
  };
}

/**
 * Convierte un pool de venta en un MapOffer seguro.
 * Utiliza current_heads calculado y coordenadas zonales públicas autorizadas.
 */
export function mapPoolToOffer(pool: PoolSummary): MapOffer {
  const baseCoords = getZoneCoordinates(pool.zone);
  const coords = getDispersedCoordinates(
    baseCoords.latitude,
    baseCoords.longitude,
    pool.id,
    1.8 // menor dispersión para pools
  );

  return {
    id: pool.id,
    type: "pool",
    title: pool.title,
    zone: baseCoords.name,
    province: "Corrientes",
    category: pool.category,
    headCount: pool.current_heads,
    targetHeads: pool.target_heads,
    currentHeads: pool.current_heads,
    status: pool.status,
    latitude: coords.latitude,
    longitude: coords.longitude,
    detailUrl: `/pools/${pool.id}`,
    producerName: `Pool Comercial (${pool.members_count} productores)`,
  };
}

/**
 * Obtiene las ofertas de mapa para el frontend.
 * Combina datos de servicios reales (si existen) y datos demostrativos estables.
 */
export function getMapOffers(
  lots?: LivestockLotWithFarm[],
  pools?: PoolSummary[]
): MapOffer[] {
  const result: MapOffer[] = [];

  if (lots && lots.length > 0) {
    for (const lot of lots) {
      if (lot.status === "disponible") {
        result.push(mapLotToOffer(lot));
      }
    }
  }

  if (pools && pools.length > 0) {
    for (const pool of pools) {
      result.push(mapPoolToOffer(pool));
    }
  }

  // Si no hay datos en la base o se está en modo demostración pura, retorna los datos de demo
  if (result.length === 0) {
    return DEMO_MAP_OFFERS;
  }

  return result;
}
