"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { MapOffer, MapFiltersState } from "@/features/geography/types";
import { INITIAL_MAP_FILTERS, filterOffers, calculateMapSummary } from "@/features/geography/filters";
import { CORRIENTES_MAP_CENTER } from "@/features/geography/zones";
import { getMapOffers } from "@/features/geography/queries";
import { MapFilters } from "./MapFilters";
import { MapLegend } from "./MapLegend";
import { MapSummary } from "./MapSummary";

// Importación de estilos obligatorios de Leaflet
import "leaflet/dist/leaflet.css";

// Dynamic import para componentes de Leaflet con SSR deshabilitado
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);

// MapMarker import dinámico
const DynamicMapMarker = dynamic(
  () => import("./MapMarker").then((mod) => mod.MapMarker),
  { ssr: false }
);

export interface YvyMapProps {
  initialOffers?: MapOffer[];
  height?: string | number;
  className?: string;
  showFilters?: boolean;
  showSummary?: boolean;
}

export function YvyMap({
  initialOffers,
  height = "520px",
  className = "",
  showFilters = true,
  showSummary = true,
}: YvyMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [filters, setFilters] = useState<MapFiltersState>(INITIAL_MAP_FILTERS);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const rawOffers: MapOffer[] = useMemo(() => {
    return initialOffers && initialOffers.length > 0
      ? initialOffers
      : getMapOffers();
  }, [initialOffers]);

  const filteredOffers = useMemo(() => {
    return filterOffers(rawOffers, filters);
  }, [rawOffers, filters]);

  const summaryStats = useMemo(() => {
    return calculateMapSummary(filteredOffers);
  }, [filteredOffers]);

  const handleFilterChange = (updated: Partial<MapFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_MAP_FILTERS);
  };

  return (
    <div className={`yvy-map-wrapper ${className}`} style={{ width: "100%", position: "relative" }}>
      {showSummary && <MapSummary stats={summaryStats} />}

      {showFilters && (
        <MapFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      )}

      {/* Contenedor del Mapa */}
      <div
        style={{
          width: "100%",
          height: typeof height === "number" ? `${height}px` : height,
          borderRadius: "0.75rem",
          overflow: "hidden",
          border: "1px solid #cbd5e1",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
          backgroundColor: "#f1f5f9",
          position: "relative",
        }}
      >
        {!isMounted ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              color: "#64748b",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                border: "3px solid #cbd5e1",
                borderTopColor: "#059669",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
              Cargando mapa ganadero regional de Corrientes...
            </span>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <MapContainer
            center={[CORRIENTES_MAP_CENTER.latitude, CORRIENTES_MAP_CENTER.longitude]}
            zoom={CORRIENTES_MAP_CENTER.defaultZoom}
            minZoom={CORRIENTES_MAP_CENTER.minZoom}
            maxZoom={CORRIENTES_MAP_CENTER.maxZoom}
            zoomControl={false}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredOffers.map((offer) => (
              <DynamicMapMarker key={`${offer.type}-${offer.id}`} offer={offer} />
            ))}
          </MapContainer>
        )}
      </div>

      <MapLegend />
    </div>
  );
}

export default YvyMap;
