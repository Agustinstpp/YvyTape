# YVYPASS — Módulo Geográfico y Mapa Regional

> **Versión:** 1.0.0  
> **Estado:** PRODUCCIÓN / LISTO PARA INTEGRACIÓN  
> **Responsable:** Persona 4 (Mapas, Simulador de Flete, WhatsApp, QA e Integración)  
> **Fecha:** Ideathon Corrientes 2026

---

## 1. Resumen de Propósito

El módulo geográfico de **YvyPass** permite a pequeños y medianos productores, compradores y operadores comerciales explorar ofertas ganaderas (lotes individuales y pools de venta conjunta) en la provincia de Corrientes y la región del NEA argentino sobre un mapa interactivo basado en OpenStreetMap y React Leaflet.

---

## 2. Política Estricta de Privacidad Geográfica

En cumplimiento de las directivas comerciales y legales para la seguridad patrimonial del productor ganadero:

1. **Ubicaciones Zonales Aproximadas:** Todos los marcadores representan centroides de localidades o áreas comerciales autorizadas (ej. Mercedes, Curuzú Cuatiá, Goya, Santo Tomé, Paso de los Libres, Bella Vista, Esquina, Monte Caseros, Corrientes Centro, Virasoro).
2. **Prohibición de Datos Catastrales y Coordenadas Exactas:** La aplicación **nunca** publica coordenadas GPS directas de establecimientos rurales, corrales, domicilios particulares ni inventarios vinculados a una georreferencia fija.
3. **Dispersión Cartográfica Determinística:** Cuando existen múltiples lotes u ofertas en una misma localidad (ej. Mercedes), se aplica un desplazamiento pseudo-aleatorio basado en el hash del ID para evitar la superposición visual de pines sin alterar la zona pública correspondiente ni permitir ingeniería inversa.

---

## 3. Arquitectura y Componentes Exportados

### 3.1 `components/mapa/YvyMap.tsx`
Componente principal del mapa ganadero regional.
- **Renderizado Seguro en Next.js (App Router):** Utiliza importación dinámica (`dynamic`) de React Leaflet con SSR deshabilitado y detección de montaje en cliente (`isMounted`) para prevenir errores de `window is not defined`.
- **Estilos:** Carga directa de `leaflet/dist/leaflet.css`.
- **Centrado:** Coordenadas provinciales generales de Corrientes (`[-28.8, -58.2]`, zoom 7).
- **Props:**
  ```typescript
  interface YvyMapProps {
    initialOffers?: MapOffer[];
    height?: string | number; // Default "520px"
    className?: string;
    showFilters?: boolean;   // Default true
    showSummary?: boolean;   // Default true
  }
  ```

### 3.2 `components/mapa/MapMarker.tsx`
Marcador de oferta ganadera con ícono SVG personalizado vectorial (`L.divIcon`).
- **Resuelve problemas de Leaflet en Next.js:** Elimina la dependencia de imágenes PNG estáticas empaquetadas por Webpack que suelen generar errores 404 en producción.
- **Distinción visual:** Verde esmeralda para **Pools** y Ámbar para **Lotes Individuales**, indicando el número de cabezas en un badge circular.
- **Ventana de Información (Popup):**
  - Tipo de oferta (Pool Colaborativo / Lote Individual).
  - Estado comercial (Abierto, Objetivo alcanzado, Disponible, Reservado).
  - Título y Zona (Localidad y Provincia).
  - Categoría ganadera y Raza.
  - Cantidad de cabezas (Progreso `actual / objetivo` en pools).
  - Peso promedio (cuando corresponda).
  - Botón de acción directo al detalle de la oferta (`detailUrl`).

### 3.3 `components/mapa/MapFilters.tsx`
Panel de control reactivo sin recarga de página (`use client`).
- Filtros implementados:
  - Tipo: Todos / Pools de Venta Conjunta / Lotes Individuales.
  - Zona: Catálogo de localidades de Corrientes.
  - Categoría: novillo, ternero, ternera, vaquillona, vaca, toro.
  - Cantidad mínima de cabezas (slider reactivo 0 a 400).
  - Botón de restablecimiento rápido.

### 3.4 `components/mapa/MapSummary.tsx`
Barra de métricas agregadas de las ofertas visibles:
- Total de ofertas en mapa.
- Cabezas totales acumuladas.
- Pools activos en convocatoria.
- Lotes individuales disponibles.
- Cantidad de zonas representadas.

### 3.5 `components/mapa/MapLegend.tsx`
Leyenda de colores y aviso legal visible de resguardo de privacidad.

---

## 4. Estructura de Tipos y Lógica Pura

### `features/geography/types.ts`
```typescript
export interface MapOffer {
  id: string;
  type: "lote" | "pool";
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
  targetHeads?: number;
  currentHeads?: number;
  producerName?: string;
}
```

### `features/geography/zones.ts`
Catálogo de centroides geográficos públicos para localidades de Corrientes y algoritmos de dispersión cartográfica no reversible.

### `features/geography/filters.ts`
Funciones puras `filterOffers` y `calculateMapSummary`, testeadas unitariamente con Vitest.

### `features/geography/queries.ts`
Adaptador de integración que transforma lotes (`LivestockLotWithFarm`) y pools (`PoolSummary`) de los contratos del backend en `MapOffer[]`, e incluye el conjunto de datos de demostración preconfigurado para la Ideathon.
