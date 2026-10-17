"use client";

import React from "react";
import { FreightComparisonResult } from "@/features/freight/types";
import { formatCurrencyARS } from "@/features/freight/calculator";

interface FreightComparisonProps {
  comparison: FreightComparisonResult;
  producerHeads: number;
  totalSharedHeads: number;
}

export function FreightComparison({
  comparison,
  producerHeads,
  totalSharedHeads,
}: FreightComparisonProps) {
  const isSaving = comparison.isSaving;
  const savingPercent = comparison.savingPercentage;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        border: "1px solid #e2e8f0",
        padding: "1.25rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        marginTop: "1.25rem",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
          Comparativa: Traslado Individual vs. Flete Compartido
        </h4>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
          Evaluación económica para el productor con su lote de {producerHeads} cabezas.
        </p>
      </div>

      {/* Grid Comparativo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        {/* Opción 1: Individual */}
        <div
          style={{
            padding: "1rem",
            borderRadius: "0.5rem",
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
          }}
        >
          <div
            style={{
              display: "inline-block",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#475569",
              backgroundColor: "#e2e8f0",
              padding: "2px 8px",
              borderRadius: "4px",
              marginBottom: "0.5rem",
            }}
          >
            OPCIÓN A: VIAJE INDIVIDUAL
          </div>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>
            El productor contrata el camión exclusivamente para sus {producerHeads} cabezas.
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Costo Total del Camión:</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              {formatCurrencyARS(comparison.individualTotalCost)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Costo por Cabeza del Productor:</span>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#b45309" }}>
              {formatCurrencyARS(comparison.individualCostPerHead)}
            </div>
          </div>
        </div>

        {/* Opción 2: Compartido en Pool */}
        <div
          style={{
            padding: "1rem",
            borderRadius: "0.5rem",
            backgroundColor: isSaving ? "#f0fdf4" : "#fff7ed",
            border: `1.5px solid ${isSaving ? "#86efac" : "#fed7aa"}`,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "inline-block",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: isSaving ? "#15803d" : "#c2410c",
              backgroundColor: isSaving ? "#dcfce7" : "#ffedd5",
              padding: "2px 8px",
              borderRadius: "4px",
              marginBottom: "0.5rem",
            }}
          >
            OPCIÓN B: FLETE COMPARTIDO (POOL)
          </div>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>
            Consolidado con otros productores ({totalSharedHeads} cabezas totales en el camión).
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Costo Total Compartido:</span>
            <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#334155" }}>
              {formatCurrencyARS(comparison.sharedTotalCost)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Costo por Cabeza Prorrateado:
            </span>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: isSaving ? "#15803d" : "#ea580c",
              }}
            >
              {formatCurrencyARS(comparison.sharedCostPerHead)}
            </div>
          </div>
          <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#475569" }}>
            Aporte del productor ({producerHeads} cab.):{" "}
            <strong>{formatCurrencyARS(comparison.producerSharedCost)}</strong>
          </div>
        </div>
      </div>

      {/* Conclusión del Impacto Económico */}
      <div
        style={{
          padding: "0.85rem 1rem",
          borderRadius: "0.5rem",
          backgroundColor: isSaving ? "#ecfdf5" : "#fff1f2",
          border: `1px solid ${isSaving ? "#a7f3d0" : "#fecdd3"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: isSaving ? "#d1fae5" : "#ffe4e6",
              color: isSaving ? "#059669" : "#e11d48",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            {isSaving ? "✓" : "!"}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: isSaving ? "#065f46" : "#9f1239", fontSize: "0.95rem" }}>
              {isSaving
                ? `Ahorro Económico Estimado: ${savingPercent !== null ? `${savingPercent}%` : ""}`
                : "Sobrecosto en Viaje Compartido"}
            </div>
            <div style={{ fontSize: "0.82rem", color: isSaving ? "#047857" : "#be123c" }}>
              {isSaving
                ? `El productor ahorra ${formatCurrencyARS(comparison.savingPerHead)} por animal trasladado.`
                : `Debido a paradas y desvíos, el traslado compartido resulta más oneroso (+${formatCurrencyARS(Math.abs(comparison.savingPerHead))} / cabeza).`}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.75rem", color: isSaving ? "#065f46" : "#9f1239" }}>
            {isSaving ? "Ahorro total para el lote:" : "Diferencia neta:"}
          </span>
          <div
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: isSaving ? "#059669" : "#e11d48",
            }}
          >
            {isSaving ? "+" : "-"}
            {formatCurrencyARS(Math.abs(comparison.savingTotalForProducer))}
          </div>
        </div>
      </div>
    </div>
  );
}
