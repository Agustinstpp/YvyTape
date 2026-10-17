"use client";

import React from "react";
import { formatHeads, formatPricePerKg, formatWeight } from "@/features/commercial/formatters";
import { Gavel, MapPin, Building, ShieldCheck } from "lucide-react";

export interface SimulatedAuctionLot {
  id: string;
  title: string;
  category: string;
  breed: string;
  heads: number;
  averageWeightKg: number;
  location: string;
  farm: string;
  basePricePerKg: number;
  currentBidPerKg: number;
  bidsCount: number;
  status: "activo" | "cerrado" | "por_iniciar";
}

interface AuctionLotCardProps {
  lot: SimulatedAuctionLot;
  onPlaceBid?: (lotId: string) => void;
  className?: string;
}

export function AuctionLotCard({ lot, onPlaceBid, className = "" }: AuctionLotCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              SIMULACIÓN
            </span>
            <span className="text-xs text-gray-500 font-medium">{lot.location}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{lot.title}</h3>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          Trazado
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-gray-50 rounded-xl text-xs sm:text-sm">
        <div>
          <span className="text-gray-500">Volumen:</span>
          <p className="font-bold text-gray-900">{formatHeads(lot.heads)}</p>
        </div>
        <div>
          <span className="text-gray-500">Categoría:</span>
          <p className="font-bold text-gray-900">{lot.category}</p>
        </div>
        <div>
          <span className="text-gray-500">Raza:</span>
          <p className="font-bold text-gray-900">{lot.breed}</p>
        </div>
        <div>
          <span className="text-gray-500">Peso est.:</span>
          <p className="font-bold text-gray-900">{formatWeight(lot.averageWeightKg)}</p>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs text-gray-500 block">Mejor puja simulada:</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-800">
              {formatPricePerKg(lot.currentBidPerKg)}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              (Base: {formatPricePerKg(lot.basePricePerKg)})
            </span>
          </div>
        </div>

        {onPlaceBid && (
          <button
            type="button"
            onClick={() => onPlaceBid(lot.id)}
            className="min-h-[44px] px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-base font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Gavel className="w-4 h-4" />
            <span>Simular puja (+$50/kg)</span>
          </button>
        )}
      </div>
    </div>
  );
}
