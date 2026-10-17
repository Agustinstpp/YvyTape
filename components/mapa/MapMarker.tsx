"use client";

import React, { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapOffer } from "@/features/geography/types";

interface MapMarkerProps {
  offer: MapOffer;
}

/**
 * Genera íconos SVG vectoriales enriquecidos para Leaflet sin depender de archivos PNG externos,
 * eliminando errores de hidratación y rutas rotas de Webpack en Next.js.
 */
function createCustomIcon(type: "pool" | "lote", heads: number) {
  const isPool = type === "pool";
  const bgColor = isPool ? "#059669" : "#d97706";
  const strokeColor = isPool ? "#064e3b" : "#78350f";
  const badgeLabel = isPool ? "POOL" : "LOTE";

  const svgHtml = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transform: translate(-50%, -100%);
    ">
      <div style="
        background-color: ${bgColor};
        color: #ffffff;
        padding: 3px 6px;
        border-radius: 9999px;
        font-size: 10px;
        font-weight: 700;
        box-shadow: 0 2px 4px rgba(0,0,0,0.25);
        border: 1.5px solid #ffffff;
        display: flex;
        align-items: center;
        gap: 3px;
        white-space: nowrap;
      ">
        <span style="opacity: 0.85;">${badgeLabel}</span>
        <span style="background: rgba(0,0,0,0.2); padding: 1px 4px; border-radius: 4px;">${heads}</span>
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid ${bgColor};
      "></div>
      <div style="
        width: 6px;
        height: 6px;
        background-color: ${strokeColor};
        border-radius: 50%;
        margin-top: -2px;
        opacity: 0.6;
      "></div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: `yvy-map-icon-${type}`,
    iconSize: [60, 40],
    iconAnchor: [30, 40],
    popupAnchor: [0, -42],
  });
}

export function MapMarker({ offer }: MapMarkerProps) {
  const icon = useMemo(
    () => createCustomIcon(offer.type, offer.headCount),
    [offer.type, offer.headCount]
  );

  const isPool = offer.type === "pool";
  const badgeBg = isPool ? "#ecfdf5" : "#fffbeb";
  const badgeColor = isPool ? "#065f46" : "#92400e";
  const statusColor =
    offer.status === "objetivo_alcanzado" || offer.status === "disponible"
      ? "#059669"
      : "#d97706";

  return (
    <Marker position={[offer.latitude, offer.longitude]} icon={icon}>
      <Popup closeButton={true} className="yvy-leaflet-popup">
        <div style={{ minWidth: "220px", maxWidth: "280px", fontFamily: "inherit" }}>
          {/* Header Badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                backgroundColor: badgeBg,
                color: badgeColor,
                padding: "2px 8px",
                borderRadius: "4px",
                border: `1px solid ${isPool ? "#a7f3d0" : "#fde68a"}`,
              }}
            >
              {isPool ? "Pool Colaborativo" : "Lote Individual"}
            </span>

            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: statusColor,
                textTransform: "capitalize",
              }}
            >
              {offer.status.replace("_", " ")}
            </span>
          </div>

          {/* Title */}
          <h4
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.3,
            }}
          >
            {offer.title}
          </h4>

          {/* Details list */}
          <div
            style={{
              fontSize: "0.8rem",
              color: "#475569",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              marginBottom: "0.75rem",
              backgroundColor: "#f8fafc",
              padding: "0.5rem",
              borderRadius: "0.375rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Zona:</span>
              <strong style={{ color: "#0f172a" }}>
                {offer.zone}, {offer.province}
              </strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Categoría:</span>
              <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>
                {offer.category}
              </strong>
            </div>

            {offer.breed && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Raza:</span>
                <strong style={{ color: "#0f172a" }}>{offer.breed}</strong>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>
                {isPool ? "Progreso Cabezas:" : "Volumen:"}
              </span>
              <strong style={{ color: isPool ? "#059669" : "#d97706" }}>
                {isPool
                  ? `${offer.currentHeads ?? offer.headCount} / ${offer.targetHeads ?? 400} cabezas`
                  : `${offer.headCount} cabezas`}
              </strong>
            </div>

            {offer.averageWeightKg && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Peso estimado:</span>
                <strong style={{ color: "#0f172a" }}>{offer.averageWeightKg} kg</strong>
              </div>
            )}
          </div>

          {/* Action button */}
          <a
            href={offer.detailUrl}
            style={{
              display: "block",
              width: "100%",
              padding: "0.45rem 0.75rem",
              textAlign: "center",
              backgroundColor: isPool ? "#059669" : "#0284c7",
              color: "#ffffff",
              borderRadius: "0.375rem",
              fontWeight: 600,
              fontSize: "0.82rem",
              textDecoration: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            Ver Detalle del {isPool ? "Pool" : "Lote"} →
          </a>
        </div>
      </Popup>
    </Marker>
  );
}
