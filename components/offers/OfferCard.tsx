"use client";

import React from "react";
import { Offer, OfferConfirmation as OfferConfirmationType } from "@/lib/types/domain";
import { formatPricePerKg, formatCommercialDate } from "@/features/commercial/formatters";
import { UserCheck, Clock, CheckCircle2, XCircle, Tag } from "lucide-react";

interface OfferCardProps {
  offer: Offer & { confirmations?: OfferConfirmationType[] };
  className?: string;
  isActive?: boolean;
}

export function OfferCard({ offer, className = "", isActive = false }: OfferCardProps) {
  const buyerName = offer.buyer?.full_name || "Comprador habilitado";

  const getStatusBadge = () => {
    switch (offer.status) {
      case "aceptada":
        return (
          <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Oferta aceptada
          </span>
        );
      case "rechazada":
        return (
          <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            Oferta desestimada
          </span>
        );
      case "pendiente":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
            <Clock className="w-3.5 h-3.5" />
            En evaluación por los productores
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-xl border p-5 transition-shadow ${
        isActive
          ? "bg-white border-blue-300 shadow-md ring-1 ring-blue-300"
          : "bg-white border-gray-200 shadow-sm"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-gray-500" />
            <span className="text-sm sm:text-base font-bold text-gray-900">
              {buyerName}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Presentada el {formatCommercialDate(offer.created_at)}
          </span>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs sm:text-sm font-medium text-gray-500">Precio propuesto:</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-800">
            {formatPricePerKg(offer.price_per_kg)}
          </span>
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-gray-400" />
          <span>Precio indicativo sobre peso vivo en balanza</span>
        </div>
      </div>
    </div>
  );
}
