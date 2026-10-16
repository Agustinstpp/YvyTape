"use client";

import React, { useState } from "react";
import { Offer, OfferConfirmation as OfferConfirmationType } from "@/lib/types/domain";
import { executeConfirmOffer } from "@/features/commercial/client-service";
import { formatPricePerKg } from "@/features/commercial/formatters";
import { Check, X, AlertCircle, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";

interface OfferConfirmationProps {
  offer: Offer;
  userConfirmation: OfferConfirmationType | null;
  isParticipant: boolean;
  onDecisionSubmitted: () => Promise<void> | void;
  className?: string;
}

export function OfferConfirmation({
  offer,
  userConfirmation,
  isParticipant,
  onDecisionSubmitted,
  className = "",
}: OfferConfirmationProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedDecision, setSelectedDecision] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isParticipant) {
    return null;
  }

  const hasAlreadyConfirmed = Boolean(userConfirmation);

  const handleConfirmDecision = async (accepted: boolean) => {
    if (isSubmitting || hasAlreadyConfirmed) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await executeConfirmOffer(offer.id, accepted);

      if (result.error) {
        setErrorMessage(result.error.message || "No pudimos registrar tu respuesta. Intentá nuevamente.");
        setIsSubmitting(false);
        return;
      }

      setSelectedDecision(null);
      await onDecisionSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Tu decisión sobre la propuesta comercial
          </h3>
          <p className="text-sm text-gray-600">
            Oferta recibida:{" "}
            <strong className="text-emerald-800 text-base">
              {formatPricePerKg(offer.price_per_kg)}
            </strong>
          </p>
        </div>
      </div>

      {/* Si el productor ya confirmó previamente */}
      {hasAlreadyConfirmed ? (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            userConfirmation?.accepted
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          {userConfirmation?.accepted ? (
            <>
              <Check className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-base">Aceptaste esta propuesta comercial</p>
                <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                  Tu lote está comprometido a la espera del cierre de la venta conjunta.
                </p>
              </div>
            </>
          ) : (
            <>
              <X className="w-6 h-6 text-rose-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-base">Rechazaste esta propuesta comercial</p>
                <p className="text-xs sm:text-sm text-rose-800 mt-0.5">
                  La oferta ha sido desestimada y la venta conjunta podrá recibir nuevas propuestas.
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Formulario para que el productor decida */
        <div className="space-y-4">
          <p className="text-sm sm:text-base text-gray-700">
            Como productor participante de este pool, tenés la decisión individual de aceptar o rechazar la propuesta comercial de compra:
          </p>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleConfirmDecision(true)}
              className="min-h-[48px] px-5 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-base font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <ThumbsUp className="w-5 h-5" />
              )}
              <span>Aceptar propuesta</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleConfirmDecision(false)}
              className="min-h-[48px] px-5 py-3 bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-400 rounded-xl text-base font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <ThumbsDown className="w-5 h-5" />
              )}
              <span>Rechazar propuesta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
