"use client";

import React from "react";
import { MapSummaryStats } from "@/features/geography/types";

interface MapSummaryProps {
  stats: MapSummaryStats;
}

export function MapSummary({ stats }: MapSummaryProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        marginBottom: "1rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
          Ofertas en Mapa
        </span>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
          {stats.totalOffers}
        </div>
      </div>

      <div style={{ textAlign: "center", borderLeft: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: "0.75rem", color: "#059669", textTransform: "uppercase", fontWeight: 600 }}>
          Cabezas Totales
        </span>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#059669" }}>
          {stats.totalHeads.toLocaleString("es-AR")}
        </div>
      </div>

      <div style={{ textAlign: "center", borderLeft: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: "0.75rem", color: "#0284c7", textTransform: "uppercase", fontWeight: 600 }}>
          Pools Activos
        </span>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0284c7" }}>
          {stats.poolsCount}
        </div>
      </div>

      <div style={{ textAlign: "center", borderLeft: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: "0.75rem", color: "#d97706", textTransform: "uppercase", fontWeight: 600 }}>
          Lotes Directos
        </span>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#d97706" }}>
          {stats.lotsCount}
        </div>
      </div>

      <div style={{ textAlign: "center", borderLeft: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: "0.75rem", color: "#475569", textTransform: "uppercase", fontWeight: 600 }}>
          Zonas NEA
        </span>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#475569" }}>
          {stats.zonesRepresented}
        </div>
      </div>
    </div>
  );
}
