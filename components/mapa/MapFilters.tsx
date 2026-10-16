"use client";

import React from "react";
import { MapFiltersState } from "@/features/geography/types";
import { CORRIENTES_ZONES } from "@/features/geography/zones";
import { LivestockCategory } from "@/lib/types/domain";

interface MapFiltersProps {
  filters: MapFiltersState;
  onChange: (updatedFilters: Partial<MapFiltersState>) => void;
  onReset: () => void;
}

const CATEGORIES: { value: LivestockCategory | "all"; label: string }[] = [
  { value: "all", label: "Todas las categorías" },
  { value: "novillo", label: "Novillos" },
  { value: "ternero", label: "Terneros" },
  { value: "ternera", label: "Terneras" },
  { value: "vaquillona", label: "Vaquillonas" },
  { value: "vaca", label: "Vacas" },
  { value: "toro", label: "Toros" },
];

export function MapFilters({ filters, onChange, onReset }: MapFiltersProps) {
  const zoneOptions = Object.values(CORRIENTES_ZONES);

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        border: "1px solid #e2e8f0",
        padding: "1rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "#0f766e" }}
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
            Filtros del Mapa Ganadero
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          style={{
            fontSize: "0.8rem",
            color: "#64748b",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            padding: "0.2rem 0.4rem",
          }}
        >
          Restablecer filtros
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {/* 1. Tipo de Oferta */}
        <div>
          <label
            htmlFor="filter-type"
            style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}
          >
            Tipo de Oferta
          </label>
          <select
            id="filter-type"
            value={filters.type}
            onChange={(e) => onChange({ type: e.target.value as any })}
            style={{
              width: "100%",
              padding: "0.45rem 0.6rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              color: "#0f172a",
              backgroundColor: "#f8fafc",
            }}
          >
            <option value="all">Todos (Pools y Lotes)</option>
            <option value="pool">Pools de Venta Conjunta</option>
            <option value="lote">Lotes Individuales</option>
          </select>
        </div>

        {/* 2. Zona / Localidad */}
        <div>
          <label
            htmlFor="filter-zone"
            style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}
          >
            Zona / Localidad
          </label>
          <select
            id="filter-zone"
            value={filters.zone}
            onChange={(e) => onChange({ zone: e.target.value })}
            style={{
              width: "100%",
              padding: "0.45rem 0.6rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              color: "#0f172a",
              backgroundColor: "#f8fafc",
            }}
          >
            <option value="all">Todas las zonas de Corrientes</option>
            {zoneOptions.map((z) => (
              <option key={z.name} value={z.name}>
                {z.name} ({z.department})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Categoría Ganadera */}
        <div>
          <label
            htmlFor="filter-category"
            style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}
          >
            Categoría
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
            style={{
              width: "100%",
              padding: "0.45rem 0.6rem",
              borderRadius: "0.375rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              color: "#0f172a",
              backgroundColor: "#f8fafc",
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Cantidad Mínima de Cabezas */}
        <div>
          <label
            htmlFor="filter-min-heads"
            style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}
          >
            Mínimo de Cabezas: {filters.minHeads > 0 ? filters.minHeads : "Cualquiera"}
          </label>
          <input
            id="filter-min-heads"
            type="range"
            min="0"
            max="400"
            step="25"
            value={filters.minHeads}
            onChange={(e) => onChange({ minHeads: Number(e.target.value) })}
            style={{
              width: "100%",
              cursor: "pointer",
              accentColor: "#059669",
            }}
          />
        </div>
      </div>
    </div>
  );
}
