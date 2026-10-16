"use client";

import React, { useState, useEffect } from "react";
import { LivestockLotWithFarm, PoolDetail, PoolStatus } from "@/lib/types/domain";
import { fetchMyLots, executeJoinPool } from "@/features/commercial/client-service";
import { CompatibleLotSelector } from "./CompatibleLotSelector";
import { formatHeads } from "@/features/commercial/formatters";
import { X, CheckCircle, AlertCircle, RefreshCw, PlusCircle, ArrowRight } from "lucide-react";

interface JoinPoolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pool: PoolDetail;
  onJoinSuccess: () => Promise<void> | void;
  initialLots?: LivestockLotWithFarm[];
}

export function JoinPoolDialog({
  isOpen,
  onClose,
  pool,
  onJoinSuccess,
  initialLots,
}: JoinPoolDialogProps) {
  const [lots, setLots] = useState<LivestockLotWithFarm[]>(initialLots || []);
  const [selectedLot, setSelectedLot] = useState<LivestockLotWithFarm | null>(null);
  const [isLoadingLots, setIsLoadingLots] = useState<boolean>(!initialLots && isOpen);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    newTotal: number;
    targetHeads: number;
    newStatus: PoolStatus;
  } | null>(null);

  useEffect(() => {
    if (isOpen && !initialLots) {
      setIsLoadingLots(true);
      setErrorMessage(null);
      setSuccessInfo(null);
      setSelectedLot(null);

      fetchMyLots()
        .then((res) => {
          if (res.error) {
            setErrorMessage(res.error.message || "No pudimos cargar tus lotes.");
          } else {
            setLots(res.data || []);
          }
        })
        .catch(() => {
          setErrorMessage("Error de conexión al cargar tus lotes.");
        })
        .finally(() => {
          setIsLoadingLots(false);
        });
    }
  }, [isOpen, initialLots]);

  if (!isOpen) return null;

  const currentHeads = pool.current_heads;
  const targetHeads = pool.target_heads;
  const simulatedNewTotal = selectedLot ? currentHeads + selectedLot.head_count : currentHeads;
  const willReachTarget = simulatedNewTotal >= targetHeads;

  const handleConfirm = async () => {
    if (!selectedLot || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await executeJoinPool(pool.id, selectedLot.id);

      if (result.error) {
        setErrorMessage(result.error.message || "No pudimos completar la adhesión. Intentá nuevamente.");
        setIsSubmitting(false);
        return;
      }

      if (result.data) {
        setSuccessInfo({
          newTotal: result.data.current_heads,
          targetHeads: result.data.target_heads,
          newStatus: result.data.pool_status,
        });

        // Notificar y revalidar en el padre
        await onJoinSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "No pudimos conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSuccessInfo(null);
    setErrorMessage(null);
    setSelectedLot(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-pool-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera del modal */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <h2 id="join-pool-title" className="text-xl sm:text-2xl font-bold text-gray-900">
              Sumar mis animales a la venta conjunta
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {pool.title} · {pool.zone}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pantalla de Éxito posterior a la adhesión */}
        {successInfo ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">
                ¡Tus animales se sumaron exitosamente!
              </h3>
              <p className="text-base text-gray-700">
                El pool ahora reúne{" "}
                <strong className="text-emerald-800 font-bold">
                  {formatHeads(successInfo.newTotal)} / {formatHeads(successInfo.targetHeads)}
                </strong>
                .
              </p>
              {successInfo.newStatus === "objetivo_alcanzado" && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold text-sm sm:text-base">
                  🎉 ¡Se alcanzó el 100% del volumen objetivo! La venta conjunta ya puede recibir ofertas de compradores.
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full min-h-[48px] px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-base font-bold shadow-md transition-colors"
            >
              Entendido, volver a la venta conjunta
            </button>
          </div>
        ) : (
          <>
            {/* Mensajes de error si existen */}
            {errorMessage && (
              <div
                className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm sm:text-base">
                  <p className="font-semibold">No se pudo sumar el lote</p>
                  <p className="mt-0.5 text-red-800">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Estado de carga de lotes */}
            {isLoadingLots ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-base font-medium text-gray-700">
                  Buscando tus lotes disponibles...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-700 font-medium">
                  <span>Seleccioná el lote que querés incorporar:</span>
                  <span>
                    Faltan <strong>{formatHeads(Math.max(0, targetHeads - currentHeads))}</strong>
                  </span>
                </div>

                {/* Selector visual de lotes compatibles e incompatibles */}
                <div className="max-h-[260px] overflow-y-auto pr-1">
                  <CompatibleLotSelector
                    lots={lots}
                    pool={pool}
                    currentHeads={currentHeads}
                    selectedLotId={selectedLot?.id || null}
                    onSelectLot={setSelectedLot}
                  />
                </div>

                {/* Resumen de impacto de la selección */}
                {selectedLot && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-emerald-900">
                      <span>Tu aporte:</span>
                      <span>+{formatHeads(selectedLot.head_count)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold text-gray-900 pt-1 border-t border-emerald-200/60">
                      <span>Resultado en la venta conjunta:</span>
                      <span className="flex items-center gap-1.5 text-emerald-800">
                        {currentHeads} → {simulatedNewTotal} / {targetHeads} cabezas
                        {willReachTarget && " (100%)"}
                      </span>
                    </div>
                    {willReachTarget && (
                      <p className="text-xs sm:text-sm text-emerald-700 font-medium">
                        ✨ ¡Con este lote la venta alcanzará su objetivo completo de 400 cabezas!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="pt-2 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-base font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedLot || isSubmitting}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-base font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Sumando lote...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>Confirmar y sumar lote</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
