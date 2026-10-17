"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Offer } from "@/lib/types/domain";
import { fetchPoolOffers } from "@/features/commercial/client-service";
import { OfferCard } from "./OfferCard";
import { Inbox, RefreshCw, AlertCircle } from "lucide-react";

interface OffersListProps {
  poolId: string;
  initialOffers?: Offer[];
  className?: string;
}

export function OffersList({ poolId, initialOffers, className = "" }: OffersListProps) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialOffers);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchPoolOffers(poolId);
      if (res.error) {
        setErrorMessage(res.error.message || "No pudimos cargar las ofertas.");
      } else {
        setOffers(res.data || []);
      }
    } catch {
      setErrorMessage("Error de conexión al cargar ofertas.");
    } finally {
      setIsLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    if (!initialOffers) {
      loadOffers();
    }
  }, [initialOffers, loadOffers]);

  if (isLoading) {
    return (
      <div className={`p-8 bg-white rounded-xl border border-gray-200 text-center space-y-2 ${className}`}>
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm text-gray-600">Consultando propuestas comerciales...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
        <button
          type="button"
          onClick={loadOffers}
          className="text-xs font-semibold text-red-700 hover:text-red-900 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-xl border border-gray-200 text-center space-y-2 ${className}`}>
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-500">
          <Inbox className="w-5 h-5" />
        </div>
        <p className="text-base text-gray-800 font-semibold">
          Aún no se han recibido ofertas comerciales para este pool.
        </p>
        <p className="text-xs sm:text-sm text-gray-500">
          Una vez alcanzado el objetivo de cabezas, los compradores autorizados podrán presentar propuestas de precio.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {offers.map((offer, index) => (
        <OfferCard
          key={offer.id}
          offer={offer}
          isActive={index === 0 && offer.status === "pendiente"}
        />
      ))}
    </div>
  );
}
