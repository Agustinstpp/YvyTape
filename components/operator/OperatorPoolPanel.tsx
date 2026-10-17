"use client";

import React, { useState } from "react";
import { PoolDetail, UserRole } from "@/lib/types/domain";
import {
  checkOperatorCloseEligibility,
  getOfferConfirmationStats,
} from "@/features/commercial/view-models";
import { formatPricePerKg, formatHeads } from "@/features/commercial/formatters";
import { ClosePoolDialog } from "./ClosePoolDialog";
import { ConfirmationProgress } from "../offers/ConfirmationProgress";
import { Lock, ShieldAlert, CheckCircle2, Clock, Info } from "lucide-react";

interface OperatorPoolPanelProps {
  pool: PoolDetail;
  currentUserId?: string;
  userRole?: UserRole;
  onOperationClosed: () => Promise<void> | void;
  className?: string;
}

export function OperatorPoolPanel({
  pool,
  currentUserId,
  userRole = "operador",
  onOperationClosed,
  className = "",
}: OperatorPoolPanelProps) {
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);

  const eligibility = checkOperatorCloseEligibility(pool, currentUserId, userRole);
  const confirmationStats = getOfferConfirmationStats(
    pool.active_offer,
    pool.members,
    currentUserId
  );

  const isClosed = pool.status === "cerrado";

  return (
    <div
      className={`bg-white rounded-xl border border-purple-200 shadow-sm p-5 sm:p-6 space-y-5 ${className}`}
      aria-label="Panel de control del operador"
    >
      {/* Encabezado del panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-purple-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Panel del Operador Comercial
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Supervisión de venta conjunta y validación de cierre demostrativo
            </p>
          </div>
        </div>

        <div>
          {isClosed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-800 border border-slate-300">
              <CheckCircle2 className="w-4 h-4 text-slate-600" />
              Operación cerrada en demo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-900 border border-blue-300">
              <Clock className="w-4 h-4 text-blue-600" />
              En negociación activa
            </span>
          )}
        </div>
      </div>

      {/* Resumen del pool bajo control del operador */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-purple-50/50 rounded-xl border border-purple-100 text-sm">
        <div>
          <span className="text-xs text-gray-500 font-medium">Volumen comercial:</span>
          <p className="font-bold text-gray-900 text-base">{formatHeads(pool.current_heads)}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium">Oferta activa:</span>
          <p className="font-bold text-emerald-800 text-base">
            {pool.active_offer ? formatPricePerKg(pool.active_offer.price_per_kg) : "Sin oferta activa"}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium">Productores únicos:</span>
          <p className="font-bold text-gray-900 text-base">
            {confirmationStats.totalProducers} participantes
          </p>
        </div>
      </div>

      {/* Progreso cuantitativo de confirmaciones */}
      {pool.active_offer && (
        <ConfirmationProgress stats={confirmationStats} />
      )}

      {/* Estado de habilitación del cierre */}
      {!isClosed && (
        <div className="space-y-3 pt-2">
          {eligibility.canClose ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Condiciones comerciales cumplidas al 100%</span>
              </div>
              <p className="text-sm text-emerald-800">
                Todos los productores participantes aceptaron la propuesta de {eligibility.pricePerKgFormatted}. Como operador podés registrar el cierre demostrativo.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3 text-gray-700 text-sm">
              <Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Cierre no habilitado aún</p>
                <p className="text-gray-600 mt-0.5">{eligibility.reason}</p>
              </div>
            </div>
          )}

          {/* Botón de cierre */}
          <button
            type="button"
            disabled={!eligibility.canClose}
            onClick={() => setIsCloseModalOpen(true)}
            className="w-full min-h-[48px] px-6 py-3 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white rounded-xl text-base font-bold shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lock className="w-5 h-5" />
            <span>Registrar cierre de demostración</span>
          </button>
        </div>
      )}

      {/* Modal de confirmación del cierre */}
      <ClosePoolDialog
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        pool={pool}
        onCloseSuccess={onOperationClosed}
      />
    </div>
  );
}
