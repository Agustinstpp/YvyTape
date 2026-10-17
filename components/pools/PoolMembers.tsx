"use client";

import React, { useState } from "react";
import { PoolMemberDetail, PoolStatus } from "@/lib/types/domain";
import { formatHeads, formatWeight, formatCategoryName } from "@/features/commercial/formatters";
import { Users, Building, ShieldCheck, Trash2, AlertCircle } from "lucide-react";

interface PoolMembersProps {
  members: PoolMemberDetail[];
  currentUserId?: string;
  poolStatus: PoolStatus;
  hasActiveOffer?: boolean;
  onLeaveLot?: (lotId: string) => Promise<void>;
  className?: string;
}

export function PoolMembers({
  members = [],
  currentUserId,
  poolStatus,
  hasActiveOffer = false,
  onLeaveLot,
  className = "",
}: PoolMembersProps) {
  const [lotLeavingId, setLotLeavingId] = useState<string | null>(null);
  const [confirmingLotId, setConfirmingLotId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canLeavePool =
    (poolStatus === "abierto" || poolStatus === "objetivo_alcanzado") && !hasActiveOffer;

  const handleConfirmLeave = async (lotId: string) => {
    if (!onLeaveLot) return;
    setActionError(null);
    setLotLeavingId(lotId);
    try {
      await onLeaveLot(lotId);
      setConfirmingLotId(null);
    } catch (err: any) {
      setActionError(err.message || "No pudimos retirar el lote. Intentá nuevamente.");
    } finally {
      setLotLeavingId(null);
    }
  };

  if (members.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 text-center space-y-2 ${className}`}>
        <p className="text-base text-gray-600 font-medium">
          Aún no se han sumado lotes a esta venta conjunta.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => {
          const lot = member.lot;
          const isOwner = Boolean(
            currentUserId &&
              (lot?.producer_id === currentUserId || lot?.producer?.id === currentUserId)
          );
          const isConfirming = confirmingLotId === lot?.id;
          const isBusy = lotLeavingId === lot?.id;

          return (
            <div
              key={member.id}
              className={`p-4 rounded-xl border transition-all ${
                isOwner
                  ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900">
                      {lot?.title || "Lote de animales"}
                    </span>
                    {isOwner && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white">
                        Tu lote
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">
                      {formatHeads(lot?.head_count || 0)}
                    </span>
                    <span>·</span>
                    <span>{formatCategoryName(lot?.category || "")}</span>
                    <span>·</span>
                    <span>{lot?.breed || "Raza declarada"}</span>
                    <span>·</span>
                    <span>{formatWeight(lot?.average_weight_kg || 0)} prom.</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Declarado
                  </span>
                </div>
              </div>

              {/* Información del establecimiento y productor */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs sm:text-sm text-gray-600 gap-2">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gray-500" />
                  <span>
                    {lot?.farm?.name || "Establecimiento"} ({lot?.farm?.zone || "Zona NEA"})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span>{lot?.producer?.full_name || "Productor de la zona"}</span>
                </div>
              </div>

              {/* Botón de Retirar mi lote (Módulo D) */}
              {isOwner && canLeavePool && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  {isConfirming ? (
                    <div className="p-2.5 bg-white rounded-lg border border-red-200 space-y-2">
                      <p className="text-xs sm:text-sm text-red-800 font-medium">
                        ¿Confirmás retirar este lote de la venta conjunta?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleConfirmLeave(lot.id)}
                          className="min-h-[36px] px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {isBusy ? "Retirando..." : "Sí, retirar"}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setConfirmingLotId(null)}
                          className="min-h-[36px] px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs sm:text-sm font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingLotId(lot.id)}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retirar mi lote</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
