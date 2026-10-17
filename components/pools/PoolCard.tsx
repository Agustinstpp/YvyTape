"use client";

import React from "react";
import Link from "next/link";
import { PoolSummary } from "@/lib/types/domain";
import { toPoolCardViewModel } from "@/features/commercial/view-models";
import { PoolProgress } from "./PoolProgress";
import { PoolStatusBadge } from "./PoolStatusBadge";
import { MapPin, Users, Tag, ArrowRight } from "lucide-react";

interface PoolCardProps {
  pool: PoolSummary;
  href?: string;
  onSelect?: (pool: PoolSummary) => void;
  className?: string;
}

export function PoolCard({ pool, href, onSelect, className = "" }: PoolCardProps) {
  const vm = toPoolCardViewModel(pool);
  const targetHref = href || `/pools/${pool.id}`;

  return (
    <article
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6 flex flex-col justify-between gap-4 ${className}`}
      aria-labelledby={`pool-title-${pool.id}`}
    >
      {/* Encabezado: Categoría, Zona y Estado */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-gray-600">
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md">
              <Tag className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
              {vm.categoryFormatted}
            </span>
            <span className="inline-flex items-center gap-1 text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
              {vm.zone}
            </span>
          </div>
          <PoolStatusBadge status={pool.status} />
        </div>

        {/* Título de la venta conjunta */}
        <h3
          id={`pool-title-${pool.id}`}
          className="text-lg sm:text-xl font-bold text-gray-900 leading-snug"
        >
          {pool.title}
        </h3>
      </div>

      {/* Progreso de cabezas */}
      <div className="py-2">
        <PoolProgress
          currentHeads={pool.current_heads}
          targetHeads={pool.target_heads}
          showDetails={true}
          size="md"
        />
      </div>

      {/* Pie de tarjeta: Productores participantes y Botón de acción */}
      <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Users className="w-4 h-4 text-gray-500" aria-hidden="true" />
          <span>
            {vm.membersCount} {vm.membersCount === 1 ? "lote sumado" : "lotes sumados"}
          </span>
        </div>

        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(pool)}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-base font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <span>Ver venta conjunta</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <Link
            href={targetHref}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-base font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <span>Ver venta conjunta</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}
