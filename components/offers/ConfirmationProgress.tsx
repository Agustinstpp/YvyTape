"use client";

import React from "react";
import { OfferConfirmationStats } from "@/features/commercial/view-models";
import { Users, CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface ConfirmationProgressProps {
  stats: OfferConfirmationStats;
  className?: string;
}

export function ConfirmationProgress({ stats, className = "" }: ConfirmationProgressProps) {
  const {
    totalProducers,
    confirmedProducers,
    acceptedCount,
    rejectedCount,
    pendingCount,
    allAccepted,
    hasRejections,
    progressPercent,
  } = stats;

  return (
    <div className={`bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200 space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-sm sm:text-base">
          <Users className="w-5 h-5 text-emerald-700" />
          <span>Confirmación de productores participantes</span>
        </div>
        <span className="text-sm font-semibold text-gray-600">
          {confirmedProducers} de {totalProducers} confirmaron
        </span>
      </div>

      {/* Barra de progreso de confirmaciones */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            hasRejections
              ? "bg-rose-500"
              : allAccepted
              ? "bg-emerald-600"
              : "bg-blue-600"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Detalle cuantitativo por productor único */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-gray-600 pt-1">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            {acceptedCount} aceptaron
          </span>
          {rejectedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-rose-800 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {rejectedCount} rechazaron
            </span>
          )}
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 text-gray-600">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {pendingCount} pendientes
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-gray-500">
          {progressPercent}% completado
        </span>
      </div>

      {/* Alerta de estado */}
      {hasRejections && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs sm:text-sm text-rose-900 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>
            Uno o más productores rechazaron la propuesta. La venta no puede cerrarse con esta oferta.
          </span>
        </div>
      )}

      {allAccepted && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs sm:text-sm text-emerald-900 font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            ¡El 100% de los productores aceptó la propuesta! La operación está lista para el cierre del operador.
          </span>
        </div>
      )}
    </div>
  );
}
