"use client";

import React from "react";
import { LivestockCategory, PoolStatus } from "@/lib/types/domain";
import { CATEGORY_LABELS } from "@/features/commercial/formatters";
import { POOL_STATUS_MAP } from "@/features/commercial/presentation";
import { Filter, RotateCcw } from "lucide-react";

export interface PoolFilterValues {
  zone?: string;
  category?: LivestockCategory | "";
  status?: PoolStatus | "";
}

interface PoolFiltersProps {
  values: PoolFilterValues;
  onChange: (values: PoolFilterValues) => void;
  availableZones?: string[];
  className?: string;
}

const DEFAULT_ZONES = [
  "Curuzú Cuatiá",
  "Mercedes",
  "Santo Tomé",
  "Goya",
  "Esquina",
  "Paso de los Libres",
  "Corrientes Centro",
];

export function PoolFilters({
  values,
  onChange,
  availableZones = DEFAULT_ZONES,
  className = "",
}: PoolFiltersProps) {
  const hasActiveFilters = Boolean(values.zone || values.category || values.status);

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...values, zone: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...values,
      category: (e.target.value as LivestockCategory) || "",
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...values,
      status: (e.target.value as PoolStatus) || "",
    });
  };

  const handleReset = () => {
    onChange({ zone: "", category: "", status: "" });
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4 ${className}`}
      role="search"
      aria-label="Filtros de ventas conjuntas"
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-gray-800 font-semibold text-base sm:text-lg">
          <Filter className="w-5 h-5 text-emerald-700" aria-hidden="true" />
          <span>Filtrar ventas conjuntas</span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 p-1.5 rounded-md hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Filtro: Zona */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-zone"
            className="block text-sm font-semibold text-gray-700"
          >
            Zona ganadera
          </label>
          <select
            id="filter-zone"
            value={values.zone || ""}
            onChange={handleZoneChange}
            className="w-full min-h-[44px] px-3.5 py-2.5 text-base bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Todas las zonas</option>
            {availableZones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro: Categoría */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-category"
            className="block text-sm font-semibold text-gray-700"
          >
            Categoría
          </label>
          <select
            id="filter-category"
            value={values.category || ""}
            onChange={handleCategoryChange}
            className="w-full min-h-[44px] px-3.5 py-2.5 text-base bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
              <option key={catKey} value={catKey}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro: Estado */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-status"
            className="block text-sm font-semibold text-gray-700"
          >
            Estado comercial
          </label>
          <select
            id="filter-status"
            value={values.status || ""}
            onChange={handleStatusChange}
            className="w-full min-h-[44px] px-3.5 py-2.5 text-base bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="">Todos los estados</option>
            {Object.entries(POOL_STATUS_MAP).map(([statusKey, info]) => (
              <option key={statusKey} value={statusKey}>
                {info.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
