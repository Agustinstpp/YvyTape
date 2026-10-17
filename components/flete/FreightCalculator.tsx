"use client";

import React, { useState, useMemo } from "react";
import {
  FreightInput,
  FreightResult,
  FreightComparisonResult,
  ProducerContributionResult,
} from "@/features/freight/types";
import {
  calculateFreight,
  compareFreight,
  distributeFreightCost,
  formatCurrencyARS,
} from "@/features/freight/calculator";
import { freightInputSchema } from "@/features/freight/validators";
import {
  DEMO_FREIGHT_SCENARIO,
  DEMO_PRODUCER_CONTRIBUTIONS,
  DEMO_COMPARISON_SCENARIO,
} from "@/features/freight/scenarios";
import { FreightComparison } from "./FreightComparison";
import { FreightSummary } from "./FreightSummary";

export interface FreightCalculatorProps {
  initialHeads?: number;
  poolId?: string;
  className?: string;
}

export function FreightCalculator({
  initialHeads,
  poolId,
  className = "",
}: FreightCalculatorProps) {
  // Estado del formulario
  const [kilometers, setKilometers] = useState<number>(DEMO_FREIGHT_SCENARIO.kilometers);
  const [stops, setStops] = useState<number>(DEMO_FREIGHT_SCENARIO.stops);
  const [heads, setHeads] = useState<number>(initialHeads || DEMO_FREIGHT_SCENARIO.heads);
  const [fixedCost, setFixedCost] = useState<number>(DEMO_FREIGHT_SCENARIO.fixedCost);
  const [costPerKm, setCostPerKm] = useState<number>(DEMO_FREIGHT_SCENARIO.costPerKm);
  const [stopSurcharge, setStopSurcharge] = useState<number>(DEMO_FREIGHT_SCENARIO.stopSurcharge);
  const [declaredCapacity, setDeclaredCapacity] = useState<number>(
    DEMO_FREIGHT_SCENARIO.declaredCapacity || 48
  );

  // Modo de visualización: "simple" | "comparativa" | "reparto"
  const [activeTab, setActiveTab] = useState<"simple" | "comparativa" | "reparto">("simple");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Estado para comparación personalizada
  const [individualHeads, setIndividualHeads] = useState<number>(15);
  const [individualKm, setIndividualKm] = useState<number>(180);

  // Cálculo en tiempo real
  const currentInput: FreightInput = useMemo(
    () => ({
      kilometers,
      stops,
      heads,
      fixedCost,
      costPerKm,
      stopSurcharge,
      declaredCapacity,
    }),
    [kilometers, stops, heads, fixedCost, costPerKm, stopSurcharge, declaredCapacity]
  );

  const freightResult: FreightResult = useMemo(() => {
    const val = freightInputSchema.safeParse(currentInput);
    if (!val.success) {
      setValidationError(val.error.errors[0]?.message || "Datos inválidos");
    } else {
      setValidationError(null);
    }
    return calculateFreight(currentInput);
  }, [currentInput]);

  const comparisonResult: FreightComparisonResult = useMemo(() => {
    return compareFreight({
      individual: {
        kilometers: individualKm,
        heads: individualHeads,
        stops: 0,
        fixedCost,
        costPerKm,
        stopSurcharge,
      },
      shared: {
        kilometers,
        totalHeads: heads,
        producerHeads: individualHeads,
        stops,
        fixedCost,
        costPerKm,
        stopSurcharge,
        declaredCapacity,
      },
    });
  }, [
    individualKm,
    individualHeads,
    kilometers,
    heads,
    stops,
    fixedCost,
    costPerKm,
    stopSurcharge,
    declaredCapacity,
  ]);

  const contributions: ProducerContributionResult[] = useMemo(() => {
    return distributeFreightCost(freightResult.totalCost, DEMO_PRODUCER_CONTRIBUTIONS);
  }, [freightResult.totalCost]);

  const handleResetToDemo = () => {
    setKilometers(DEMO_FREIGHT_SCENARIO.kilometers);
    setStops(DEMO_FREIGHT_SCENARIO.stops);
    setHeads(initialHeads || DEMO_FREIGHT_SCENARIO.heads);
    setFixedCost(DEMO_FREIGHT_SCENARIO.fixedCost);
    setCostPerKm(DEMO_FREIGHT_SCENARIO.costPerKm);
    setStopSurcharge(DEMO_FREIGHT_SCENARIO.stopSurcharge);
    setDeclaredCapacity(48);
    setIndividualHeads(15);
    setIndividualKm(180);
    setValidationError(null);
  };

  return (
    <div
      className={`yvy-freight-calculator ${className}`}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        border: "1px solid #e2e8f0",
        padding: "1.25rem",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.25rem" }}>🚛</span>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              Simulador de Flete Ganadero Compartido
            </h3>
          </div>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
            {poolId ? `Estimación vinculada al Pool: ${poolId}` : "Cálculo logístico y comparativa de ahorro colaborativo para Corrientes."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDemo}
          style={{
            fontSize: "0.8rem",
            color: "#059669",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "0.375rem",
            padding: "0.35rem 0.65rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Cargar Escenario Demo (40 cab. / 200 km)
        </button>
      </div>

      {/* Selector de pestañas */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.25rem",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("simple")}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "0.375rem",
            border: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor: activeTab === "simple" ? "#059669" : "#f1f5f9",
            color: activeTab === "simple" ? "#ffffff" : "#475569",
          }}
        >
          1. Calculador de Viaje
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("comparativa")}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "0.375rem",
            border: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor: activeTab === "comparativa" ? "#059669" : "#f1f5f9",
            color: activeTab === "comparativa" ? "#ffffff" : "#475569",
          }}
        >
          2. Comparativa Individual vs. Pool
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reparto")}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: "0.375rem",
            border: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor: activeTab === "reparto" ? "#059669" : "#f1f5f9",
            color: activeTab === "reparto" ? "#ffffff" : "#475569",
          }}
        >
          3. Reparto entre Productores
        </button>
      </div>

      {/* Alerta de Error de Validación */}
      {validationError && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            padding: "0.6rem 0.85rem",
            borderRadius: "0.375rem",
            fontSize: "0.82rem",
            marginBottom: "1rem",
            border: "1px solid #fecaca",
          }}
        >
          <strong>Error de entrada:</strong> {validationError}
        </div>
      )}

      {/* Alerta de Capacidad Superada */}
      {freightResult.exceedsCapacity && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            color: "#92400e",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.85rem",
            marginBottom: "1rem",
            border: "1px solid #fde68a",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>⚠️</span>
          <div>
            <strong>Advertencia de Capacidad:</strong> La cantidad transportada ({heads} animales)
            supera la capacidad declarada de la jaula ({declaredCapacity} cabezas) por{" "}
            <strong>+{freightResult.capacityDifference} cabezas</strong>.
            Considere contratar jaula doble o unidades adicionales según normativa SENASA y bienestar animal.
          </div>
        </div>
      )}

      {/* Formulario de Parámetros */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.85rem",
          backgroundColor: "#f8fafc",
          padding: "1rem",
          borderRadius: "0.5rem",
          border: "1px solid #e2e8f0",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <label htmlFor="f-km" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
            Distancia Total (km)
          </label>
          <input
            id="f-km"
            type="number"
            min="0"
            max="5000"
            value={kilometers}
            onChange={(e) => setKilometers(Number(e.target.value))}
            style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", marginTop: "0.2rem" }}
          />
        </div>

        <div>
          <label htmlFor="f-stops" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
            Paradas Intermedias
          </label>
          <input
            id="f-stops"
            type="number"
            min="0"
            max="20"
            value={stops}
            onChange={(e) => setStops(Number(e.target.value))}
            style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", marginTop: "0.2rem" }}
          />
        </div>

        <div>
          <label htmlFor="f-heads" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
            Cabezas Transportadas
          </label>
          <input
            id="f-heads"
            type="number"
            min="1"
            max="1000"
            value={heads}
            onChange={(e) => setHeads(Number(e.target.value))}
            style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", marginTop: "0.2rem" }}
          />
        </div>

        <div>
          <label htmlFor="f-capacity" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
            Capacidad Máx. Jaula
          </label>
          <input
            id="f-capacity"
            type="number"
            min="1"
            max="100"
            value={declaredCapacity}
            onChange={(e) => setDeclaredCapacity(Number(e.target.value))}
            style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", marginTop: "0.2rem" }}
          />
        </div>

        <div>
          <label htmlFor="f-fixed" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
            Costo Fijo Base (ARS)
          </label>
          <input
            id="f-fixed"
            type="number"
            min="0"
            step="10000"
            value={fixedCost}
            onChange={(e) => setFixedCost(Number(e.target.value))}
            style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", marginTop: "0.2rem" }}
          />
        </div>

        <div>
          <label htmlFor="f-perkm" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
            Costo por Km (ARS)
          </label>
          <input
            id="f-perkm"
            type="number"
            min="0"
            step="100"
            value={costPerKm}
            onChange={(e) => setCostPerKm(Number(e.target.value))}
            style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", marginTop: "0.2rem" }}
          />
        </div>

        <div>
          <label htmlFor="f-surcharge" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
            Recargo por Parada (ARS)
          </label>
          <input
            id="f-surcharge"
            type="number"
            min="0"
            step="5000"
            value={stopSurcharge}
            onChange={(e) => setStopSurcharge(Number(e.target.value))}
            style={{ width: "100%", padding: "0.45rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", marginTop: "0.2rem" }}
          />
        </div>
      </div>

      {/* Resultados de la Simulación Básica */}
      {activeTab === "simple" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>
              Costo Total Estimado del Viaje
            </span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#15803d", marginTop: "0.25rem" }}>
              {formatCurrencyARS(freightResult.totalCost)}
            </div>
            <span style={{ fontSize: "0.75rem", color: "#16a34a" }}>
              Fijo + ({kilometers} km × {formatCurrencyARS(costPerKm)}) + ({stops} paradas × {formatCurrencyARS(stopSurcharge)})
            </span>
          </div>

          <div
            style={{
              padding: "1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "#1e40af", textTransform: "uppercase", fontWeight: 700 }}>
              Costo por Cabeza Transportada
            </span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1d4ed8", marginTop: "0.25rem" }}>
              {formatCurrencyARS(freightResult.costPerHead)}
            </div>
            <span style={{ fontSize: "0.75rem", color: "#3b82f6" }}>
              Prorrateado sobre {heads} animales transportados
            </span>
          </div>
        </div>
      )}

      {/* Pestaña: Comparativa Individual vs Compartido */}
      {activeTab === "comparativa" && (
        <div>
          <div
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "#f8fafc",
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              marginBottom: "1rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <div>
              <label htmlFor="f-ind-heads" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
                Cabezas del Productor en Comparación:
              </label>
              <input
                id="f-ind-heads"
                type="number"
                min="1"
                max={heads}
                value={individualHeads}
                onChange={(e) => setIndividualHeads(Number(e.target.value))}
                style={{ width: "100%", padding: "0.4rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", marginTop: "0.2rem" }}
              />
            </div>
            <div>
              <label htmlFor="f-ind-km" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
                Distancia si viaja solo (km):
              </label>
              <input
                id="f-ind-km"
                type="number"
                min="1"
                max="5000"
                value={individualKm}
                onChange={(e) => setIndividualKm(Number(e.target.value))}
                style={{ width: "100%", padding: "0.4rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", marginTop: "0.2rem" }}
              />
            </div>
          </div>

          <FreightComparison
            comparison={comparisonResult}
            producerHeads={individualHeads}
            totalSharedHeads={heads}
          />
        </div>
      )}

      {/* Pestaña: Reparto entre Productores */}
      {activeTab === "reparto" && (
        <FreightSummary
          contributions={contributions}
          totalCost={freightResult.totalCost}
          totalHeads={DEMO_PRODUCER_CONTRIBUTIONS.reduce((a, b) => a + b.heads, 0)}
        />
      )}

      {/* Advertencia de supuestos legales y de negocio */}
      <div
        style={{
          marginTop: "1.25rem",
          padding: "0.75rem 1rem",
          backgroundColor: "#f8fafc",
          borderRadius: "0.5rem",
          border: "1px solid #e2e8f0",
          fontSize: "0.78rem",
          color: "#64748b",
          lineHeight: 1.4,
        }}
      >
        <strong>Aviso Legal y Demostrativo (Ideathon Corrientes 2026):</strong> Las tarifas y cálculos mostrados
        son estimaciones paramétricas simuladas para demostrar el valor económico de la comercialización
        conjunta. No constituyen cotización vinculante, contrato de flete ni certificación de habilitación
        vehicular o sanitaria oficial.
      </div>
    </div>
  );
}

export default FreightCalculator;
