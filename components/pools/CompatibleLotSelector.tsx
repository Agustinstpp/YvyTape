"use client";

import React from "react";
import { LivestockLotWithFarm, PoolStatus } from "@/lib/types/domain";
import { checkLotCompatibility } from "@/features/commercial/compatibility";
import { formatHeads, formatWeight, formatCategoryName } from "@/features/commercial/formatters";
import { Check, AlertTriangle, Building, Tag } from "lucide-react";

interface CompatibleLotSelectorProps {
  lots: LivestockLotWithFarm[];
  pool: {
    category: string;
    zone: string;
    target_heads: number;
    status: PoolStatus;
  };
  currentHeads: number;
  selectedLotId: string | null;
  onSelectLot: (lot: LivestockLotWithFarm) => void;
  className?: string;
}

export function CompatibleLotSelector({
  lots,
  pool,
  currentHeads,
  selectedLotId,
  onSelectLot,
  className = "",
}: CompatibleLotSelectorProps) {
  if (lots.length === 0) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-2">
        <p className="text-base text-gray-700 font-medium">
          No tenés lotes de animales registrados en tu cuenta.
        </p>
        <p className="text-sm text-gray-500">
          Registrá un lote de animales primero para poder sumarlo a esta venta conjunta.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`} role="radiogroup" aria-label="Seleccionar lote de animales">
      {lots.map((lot) => {
        const check = checkLotCompatibility(lot, pool, currentHeads);
        const isSelected = selectedLotId === lot.id;
        const isCompatible = check.isCompatible;

        return (
          <div
            key={lot.id}
            onClick={() => {
              if (isCompatible) onSelectLot(lot);
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              !isCompatible
                ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                : isSelected
                ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 cursor-pointer shadow-sm"
                : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20 cursor-pointer"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900">
                    {lot.title}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white">
                      <Check className="w-3 h-3" />
                      Seleccionado
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                  <span className="font-bold text-gray-900 text-base">
                    {formatHeads(lot.head_count)}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-gray-500" />
                    {formatCategoryName(lot.category)}
                  </span>
                  <span>·</span>
                  <span>{lot.breed || "Raza registrada"}</span>
                  <span>·</span>
                  <span>{formatWeight(lot.average_weight_kg)}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 pt-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>
                    {lot.farm?.name || "Establecimiento"} ({lot.farm?.zone || "Zona no informada"})
                  </span>
                </div>
              </div>

              {/* Botón o indicador de selección */}
              <div className="flex-shrink-0 pt-1">
                {isCompatible ? (
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs">
                    ✕
                  </div>
                )}
              </div>
            </div>

            {/* Motivo de incompatibilidad explicativo para el productor */}
            {!isCompatible && (
              <div className="mt-2.5 pt-2 border-t border-gray-200/80 flex items-center gap-2 text-xs sm:text-sm text-amber-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{check.reason}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
