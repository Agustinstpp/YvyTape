"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PoolSummary } from "@/lib/types/domain";
import { fetchPools } from "@/features/commercial/client-service";
import { PoolCard } from "./PoolCard";
import { PoolFilters, PoolFilterValues } from "./PoolFilters";
import { AlertCircle, RefreshCw, Inbox } from "lucide-react";

interface PoolListProps {
  initialPools?: PoolSummary[];
  enableFilters?: boolean;
  onSelectPool?: (pool: PoolSummary) => void;
  className?: string;
}

export function PoolList({
  initialPools,
  enableFilters = true,
  onSelectPool,
  className = "",
}: PoolListProps) {
  const [pools, setPools] = useState<PoolSummary[]>(initialPools || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialPools);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [filterValues, setFilterValues] = useState<PoolFilterValues>({
    zone: "",
    category: "",
    status: "",
  });

  const loadPools = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchPools();
      if (result.error) {
        setErrorMessage(result.error.message || "No pudimos cargar las ventas conjuntas.");
      } else {
        setPools(result.data || []);
      }
    } catch {
      setErrorMessage("No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialPools) {
      loadPools();
    }
  }, [initialPools, loadPools]);

  // Zonas únicas disponibles para el selector
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    for (const p of pools) {
      if (p.zone) set.add(p.zone);
    }
    return Array.from(set);
  }, [pools]);

  // Filtrado reactivo en memoria para respuesta instantánea
  const filteredPools = useMemo(() => {
    return pools.filter((p) => {
      if (filterValues.zone && p.zone.toLowerCase() !== filterValues.zone.toLowerCase()) {
        return false;
      }
      if (filterValues.category && p.category !== filterValues.category) {
        return false;
      }
      if (filterValues.status && p.status !== filterValues.status) {
        return false;
      }
      return true;
    });
  }, [pools, filterValues]);

  const handleResetFilters = () => {
    setFilterValues({ zone: "", category: "", status: "" });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Barra de filtros */}
      {enableFilters && (
        <PoolFilters
          values={filterValues}
          onChange={setFilterValues}
          availableZones={availableZones.length > 0 ? availableZones : undefined}
        />
      )}

      {/* Estado: Cargando */}
      {isLoading && (
        <div
          className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200 text-center space-y-3"
          aria-live="polite"
        >
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" aria-hidden="true" />
          <p className="text-base sm:text-lg font-medium text-gray-700">
            Cargando ventas conjuntas...
          </p>
        </div>
      )}

      {/* Estado: Error */}
      {!isLoading && errorMessage && (
        <div
          className="p-6 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <h4 className="text-base font-bold text-red-900">
                Ocurrió un problema al cargar los pools
              </h4>
              <p className="text-sm text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadPools}
            className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado: Sin resultados */}
      {!isLoading && !errorMessage && filteredPools.length === 0 && (
        <div className="p-10 bg-white border border-gray-200 rounded-xl text-center space-y-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-500">
            <Inbox className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">
              No encontramos ventas conjuntas con estos filtros.
            </h3>
            <p className="text-base text-gray-600">
              Probá seleccionando otra zona, categoría o estado comercial.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="min-h-[44px] px-5 py-2.5 text-base font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Limpiar filtros y ver todas
          </button>
        </div>
      )}

      {/* Grilla de pools */}
      {!isLoading && !errorMessage && filteredPools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onSelect={onSelectPool}
            />
          ))}
        </div>
      )}
    </div>
  );
}
