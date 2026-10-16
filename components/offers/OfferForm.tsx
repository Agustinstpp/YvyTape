"use client";

import React, { useState } from "react";
import { PoolDetail } from "@/lib/types/domain";
import { executeCreateOffer } from "@/features/commercial/client-service";
import { formatPricePerKg, formatHeads, formatCurrency, formatWeight } from "@/features/commercial/formatters";
import { DollarSign, AlertCircle, RefreshCw, CheckCircle, ShieldAlert } from "lucide-react";

interface OfferFormProps {
  pool: PoolDetail;
  onOfferCreated: () => Promise<void> | void;
  className?: string;
}

export function OfferForm({ pool, onOfferCreated, className = "" }: OfferFormProps) {
  const [priceInput, setPriceInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const priceNumber = parseFloat(priceInput.replace(/[^0-9.]/g, ""));
  const isValidPrice = !isNaN(priceNumber) && priceNumber > 0 && isFinite(priceNumber);

  // Cálculo de peso total aproximado de los lotes miembros
  const totalWeightKg = pool.members.reduce((acc, m) => {
    const lot = m.lot;
    if (lot) {
      return acc + (lot.head_count * lot.average_weight_kg);
    }
    return acc;
  }, 0);

  const estimatedTotalValue = isValidPrice && totalWeightKg > 0 ? priceNumber * totalWeightKg : 0;
  const averageWeight = pool.current_heads > 0 && totalWeightKg > 0 ? totalWeightKg / pool.current_heads : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPrice || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await executeCreateOffer(pool.id, { price_per_kg: priceNumber });

      if (result.error) {
        setErrorMessage(result.error.message || "No se pudo presentar la oferta.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("¡Oferta indicativa presentada con éxito! El pool pasó a estado de negociación.");
      setPriceInput("");
      await onOfferCreated();
    } catch (err: any) {
      setErrorMessage(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-5 ${className}`}
      aria-label="Formulario de oferta indicativa"
    >
      <div className="border-b border-gray-100 pb-3">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
          Presentar oferta indicativa de compra
        </h3>
        <p className="text-sm text-gray-600 mt-0.5">
          Para este conjunto de {formatHeads(pool.current_heads)} en {pool.zone}.
        </p>
      </div>

      {/* Aclaración legal obligatoria */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
        <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Aviso importante:</strong> Esta oferta es indicativa y no constituye una compraventa formalizada. Los productores participantes deberán evaluar y confirmar su participación individual.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Input de precio */}
      <div className="space-y-2">
        <label
          htmlFor="offer-price"
          className="block text-sm sm:text-base font-bold text-gray-900"
        >
          Precio ofrecido por kilogramo vivo (en pesos argentinos)
        </label>
        <div className="relative rounded-lg shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-bold text-base">
            $
          </div>
          <input
            id="offer-price"
            type="number"
            min="1"
            step="1"
            placeholder="Ej: 2950"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            disabled={isSubmitting}
            className="w-full min-h-[48px] pl-8 pr-16 text-lg font-semibold bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-500 font-medium text-sm">
            / kg
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Ingresá un valor numérico mayor a cero (ejemplo: 2950).
        </p>
      </div>

      {/* Resumen dinámico en tiempo real */}
      {isValidPrice && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-sm">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
            Resumen de la propuesta
          </h4>
          <div className="grid grid-cols-2 gap-2 text-gray-700">
            <div>Volumen agrupado:</div>
            <div className="font-semibold text-right text-gray-900">{formatHeads(pool.current_heads)}</div>
            {averageWeight > 0 && (
              <>
                <div>Peso promedio:</div>
                <div className="font-semibold text-right text-gray-900">{formatWeight(averageWeight)}</div>
              </>
            )}
            <div>Precio unitario:</div>
            <div className="font-semibold text-right text-emerald-800">{formatPricePerKg(priceNumber)}</div>
            {estimatedTotalValue > 0 && (
              <>
                <div className="pt-2 border-t border-gray-200 font-bold text-gray-900">Total aproximado:</div>
                <div className="pt-2 border-t border-gray-200 font-bold text-right text-emerald-900 text-base">
                  {formatCurrency(estimatedTotalValue)}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={!isValidPrice || isSubmitting}
        className="w-full min-h-[48px] px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-base font-bold shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Enviando oferta comercial...</span>
          </>
        ) : (
          <>
            <DollarSign className="w-5 h-5" />
            <span>Presentar propuesta indicativa</span>
          </>
        )}
      </button>
    </form>
  );
}
