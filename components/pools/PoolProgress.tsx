"use client";

import React from "react";
import { calculateProgress, formatHeads } from "@/features/commercial/formatters";

interface PoolProgressProps {
  currentHeads: number;
  targetHeads: number;
  className?: string;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PoolProgress({
  currentHeads,
  targetHeads,
  className = "",
  showDetails = true,
  size = "md",
}: PoolProgressProps) {
  const { percentage, percentageFormatted, remainingHeads, isComplete } =
    calculateProgress(currentHeads, targetHeads);

  const barHeight =
    size === "sm" ? "h-2.5" : size === "lg" ? "h-5" : "h-3.5";

  const barColor = isComplete
    ? "bg-amber-500"
    : percentage >= 75
    ? "bg-emerald-600"
    : "bg-blue-600";

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {/* Indicadores numéricos principales */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {formatHeads(currentHeads)}
          </span>
          <span className="text-sm sm:text-base font-medium text-gray-500">
            / {formatHeads(targetHeads)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-base sm:text-lg font-bold text-gray-800">
            {percentageFormatted}
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${barHeight}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso del pool: ${percentageFormatted}`}
      >
        <div
          className={`${barHeight} rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Detalle complementario para el productor */}
      {showDetails && (
        <div className="flex items-center justify-between text-sm sm:text-base">
          {remainingHeads > 0 ? (
            <p className="font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              Faltan <strong className="font-bold">{formatHeads(remainingHeads)}</strong> para alcanzar el objetivo.
            </p>
          ) : (
            <p className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              ¡Objetivo alcanzado! ({formatHeads(targetHeads)})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
