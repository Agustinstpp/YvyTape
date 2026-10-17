"use client";

import React from "react";

export function MapLegend() {
  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        marginTop: "0.75rem",
        fontSize: "0.85rem",
        color: "#334155",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          {/* Legend item: Pool */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "#059669",
                border: "2px solid #ffffff",
                boxShadow: "0 0 0 1.5px #059669",
              }}
            />
            <span style={{ fontWeight: 600, color: "#065f46" }}>
              Pool de Venta Conjunta (Verde)
            </span>
          </div>

          {/* Legend item: Lote */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "#d97706",
                border: "2px solid #ffffff",
                boxShadow: "0 0 0 1.5px #d97706",
              }}
            />
            <span style={{ fontWeight: 600, color: "#92400e" }}>
              Lote Individual (Ámbar)
            </span>
          </div>
        </div>

        {/* Privacy Note */}
        <div
          style={{
            fontSize: "0.75rem",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "#0284c7", flexShrink: 0 }}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>
            <strong>Privacidad Protegida:</strong> Ubicaciones zonales aproximadas.
            No se revelan coordenadas exactas de campos ni corrales.
          </span>
        </div>
      </div>
    </div>
  );
}
