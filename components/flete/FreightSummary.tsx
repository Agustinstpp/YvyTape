"use client";

import React from "react";
import { ProducerContributionResult } from "@/features/freight/types";
import { formatCurrencyARS } from "@/features/freight/calculator";

interface FreightSummaryProps {
  contributions: ProducerContributionResult[];
  totalCost: number;
  totalHeads: number;
}

export function FreightSummary({
  contributions,
  totalCost,
  totalHeads,
}: FreightSummaryProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        border: "1px solid #e2e8f0",
        padding: "1rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        marginTop: "1.25rem",
      }}
    >
      <div style={{ marginBottom: "0.75rem" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
          Distribución Proporcional de Costos entre Productores
        </h4>
        <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
          Reparto equitativo según cabezas aportadas al transporte conjunto (suma exacta garantizada).
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
            textAlign: "left",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
              <th style={{ padding: "0.5rem 0.75rem", color: "#475569", fontWeight: 600 }}>Productor</th>
              <th style={{ padding: "0.5rem 0.75rem", color: "#475569", fontWeight: 600, textAlign: "right" }}>
                Cabezas
              </th>
              <th style={{ padding: "0.5rem 0.75rem", color: "#475569", fontWeight: 600, textAlign: "right" }}>
                % Carga
              </th>
              <th style={{ padding: "0.5rem 0.75rem", color: "#475569", fontWeight: 600, textAlign: "right" }}>
                Costo Asignado
              </th>
              <th style={{ padding: "0.5rem 0.75rem", color: "#475569", fontWeight: 600, textAlign: "right" }}>
                Costo / Cabeza
              </th>
            </tr>
          </thead>
          <tbody>
            {contributions.map((c) => (
              <tr key={c.producerId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.6rem 0.75rem", fontWeight: 500, color: "#1e293b" }}>
                  {c.producerName}
                </td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", color: "#334155" }}>
                  {c.heads} cab.
                </td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", color: "#64748b" }}>
                  {c.percentageOfLoad}%
                </td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontWeight: 600, color: "#065f46" }}>
                  {formatCurrencyARS(c.allocatedCost)}
                </td>
                <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", color: "#0f766e" }}>
                  {formatCurrencyARS(c.costPerHead)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#f1f5f9", fontWeight: 700, borderTop: "2px solid #cbd5e1" }}>
              <td style={{ padding: "0.6rem 0.75rem", color: "#0f172a" }}>TOTAL CONSOLIDADO</td>
              <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", color: "#0f172a" }}>
                {totalHeads} cab.
              </td>
              <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", color: "#0f172a" }}>100%</td>
              <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", color: "#059669" }}>
                {formatCurrencyARS(totalCost)}
              </td>
              <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", color: "#059669" }}>
                {totalHeads > 0 ? formatCurrencyARS(totalCost / totalHeads) : "$ 0"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
