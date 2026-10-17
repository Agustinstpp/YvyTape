"use client";

import React, { useState } from "react";
import { PoolDetail } from "@/lib/types/domain";
import { executeClosePool } from "@/features/commercial/client-service";
import { formatPricePerKg, formatHeads } from "@/features/commercial/formatters";
import { AlertTriangle, Lock, RefreshCw, X, ShieldAlert } from "lucide-react";

interface ClosePoolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pool: PoolDetail;
  onCloseSuccess: () => Promise<void> | void;
}

export function ClosePoolDialog({
  isOpen,
  onClose,
  pool,
  onCloseSuccess,
}: ClosePoolDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeOffer = pool.active_offer;
  const priceFormatted = activeOffer ? formatPricePerKg(activeOffer.price_per_kg) : "$ 0 / kg";

  const handleConfirmClose = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await executeClosePool(pool.id);

      if (result.error) {
        setErrorMessage(result.error.message || "No se pudo cerrar la operación.");
        setIsSubmitting(false);
        return;
      }

      await onCloseSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-pool-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-xl">
            <Lock className="w-6 h-6 text-purple-700" />
            <h2 id="close-pool-modal-title">Cierre comercial demostrativo</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advertencia obligatoria del marco regulatorio / entorno demo */}
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-950 text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Advertencia del entorno de demostración:</strong> Esta acción registra el cierre del escenario de prueba en YvyPass. La compraventa real requiere intervención de operadores comerciales habilitados y documentación oficial correspondiente (DTA/e-DTA, SENASA y contratos formales).
          </p>
        </div>

        {/* Resumen del cierre */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Venta conjunta:</span>
            <span className="font-bold text-gray-900">{pool.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Volumen pactado:</span>
            <span className="font-bold text-gray-900">{formatHeads(pool.current_heads)}</span>
          </div>
          <div className="flex justify-between">
            <span>Precio final acordado:</span>
            <span className="font-bold text-emerald-800 text-base">{priceFormatted}</span>
          </div>
          <div className="flex justify-between">
            <span>Aceptación de productores:</span>
            <span className="font-bold text-emerald-700">100% Unánime</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-base font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white rounded-xl text-base font-bold shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Registrando cierre...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Registrar cierre de demostración</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
