/**
 * YVYPASS — Zonas y Capas Geográficas Públicas de Corrientes y NEA
 *
 * PRIVACIDAD GARANTIZADA:
 * Este catálogo define centroides de localidades y departamentos reconocidos de la
 * provincia de Corrientes. Ningún dato proviene de catastros privados ni geolocalizaciones
 * satelitales directas de establecimientos o corrales de productores.
 */

import { ZoneCoordinates } from "./types";

/**
 * Coordenadas oficiales de centro de la Provincia de Corrientes para centrado inicial de mapa.
 */
export const CORRIENTES_MAP_CENTER = {
  latitude: -28.8,
  longitude: -58.2,
  defaultZoom: 7,
  minZoom: 6,
  maxZoom: 13,
};

/**
 * Catálogo público de localidades y zonas comerciales ganaderas de Corrientes.
 */
export const CORRIENTES_ZONES: Record<string, ZoneCoordinates> = {
  mercedes: {
    name: "Mercedes",
    department: "Mercedes",
    province: "Corrientes",
    latitude: -29.1842,
    longitude: -58.0752,
    radiusKm: 25,
  },
  curuzu_cuatia: {
    name: "Curuzú Cuatiá",
    department: "Curuzú Cuatiá",
    province: "Corrientes",
    latitude: -29.7917,
    longitude: -58.0549,
    radiusKm: 30,
  },
  goya: {
    name: "Goya",
    department: "Goya",
    province: "Corrientes",
    latitude: -29.1442,
    longitude: -59.2652,
    radiusKm: 20,
  },
  santo_tome: {
    name: "Santo Tomé",
    department: "Santo Tomé",
    province: "Corrientes",
    latitude: -28.5494,
    longitude: -56.0408,
    radiusKm: 25,
  },
  paso_de_los_libres: {
    name: "Paso de los Libres",
    department: "Paso de los Libres",
    province: "Corrientes",
    latitude: -29.7125,
    longitude: -57.0883,
    radiusKm: 25,
  },
  monte_caseros: {
    name: "Monte Caseros",
    department: "Monte Caseros",
    province: "Corrientes",
    latitude: -30.2544,
    longitude: -57.6364,
    radiusKm: 20,
  },
  bella_vista: {
    name: "Bella Vista",
    department: "Bella Vista",
    province: "Corrientes",
    latitude: -28.5085,
    longitude: -59.0437,
    radiusKm: 20,
  },
  esquina: {
    name: "Esquina",
    department: "Esquina",
    province: "Corrientes",
    latitude: -30.0144,
    longitude: -59.5306,
    radiusKm: 25,
  },
  san_roque: {
    name: "San Roque",
    department: "San Roque",
    province: "Corrientes",
    latitude: -28.5736,
    longitude: -58.7333,
    radiusKm: 20,
  },
  corrientes_centro: {
    name: "Corrientes Centro",
    department: "Mercedes / San Roque",
    province: "Corrientes",
    latitude: -28.85,
    longitude: -58.35,
    radiusKm: 40,
  },
  corrientes_capital: {
    name: "Corrientes Capital",
    department: "Capital",
    province: "Corrientes",
    latitude: -27.4698,
    longitude: -58.8344,
    radiusKm: 15,
  },
  virasoro: {
    name: "Gobernador Virasoro",
    department: "Santo Tomé",
    province: "Corrientes",
    latitude: -28.0494,
    longitude: -56.0333,
    radiusKm: 20,
  },
};

/**
 * Normaliza una cadena de texto para coincidir con el catálogo de zonas.
 */
export function normalizeZoneKey(zone: string): string {
  return zone
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[\s\-_]+/g, "_");
}

/**
 * Obtiene las coordenadas públicas representativas para una zona dada.
 * Si la zona no se encuentra explícitamente, retorna el centroide provincial.
 */
export function getZoneCoordinates(zoneName: string): ZoneCoordinates {
  if (!zoneName) {
    return {
      name: "Corrientes General",
      department: "Provincia de Corrientes",
      province: "Corrientes",
      latitude: CORRIENTES_MAP_CENTER.latitude,
      longitude: CORRIENTES_MAP_CENTER.longitude,
    };
  }

  const key = normalizeZoneKey(zoneName);

  // Búsqueda directa
  if (CORRIENTES_ZONES[key]) {
    return CORRIENTES_ZONES[key];
  }

  // Búsqueda por inclusión de términos
  for (const [k, coords] of Object.entries(CORRIENTES_ZONES)) {
    if (key.includes(k) || k.includes(key)) {
      return coords;
    }
  }

  // Fallback seguro a centro de Corrientes
  return {
    name: zoneName,
    department: "Provincia de Corrientes",
    province: "Corrientes",
    latitude: CORRIENTES_MAP_CENTER.latitude,
    longitude: CORRIENTES_MAP_CENTER.longitude,
  };
}

/**
 * Aplica una pequeña dispersión determinística pseudo-aleatoria basada en el ID
 * para que múltiples ofertas dentro de una misma zona pública (ej: Mercedes)
 * no queden superpuestas en el mismo píxel, manteniendo la privacidad absoluta.
 */
export function getDispersedCoordinates(
  baseLat: number,
  baseLng: number,
  seedId: string,
  spreadKm: number = 2.5
): { latitude: number; longitude: number } {
  // Hash determinístico simple de seedId
  let hash = 0;
  for (let i = 0; i < seedId.length; i++) {
    hash = (hash << 5) - hash + seedId.charCodeAt(i);
    hash |= 0;
  }

  // Derivar ángulo y distancia determinísticos
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const distanceKm = ((Math.abs(hash >> 3) % 100) / 100) * spreadKm;

  // 1 grado latitud ≈ 111 km, 1 grado longitud ≈ 111 km * cos(lat)
  const dLat = (distanceKm * Math.cos(angle)) / 111.0;
  const dLng =
    (distanceKm * Math.sin(angle)) /
    (111.0 * Math.cos((baseLat * Math.PI) / 180));

  return {
    latitude: Number((baseLat + dLat).toFixed(5)),
    longitude: Number((baseLng + dLng).toFixed(5)),
  };
}
