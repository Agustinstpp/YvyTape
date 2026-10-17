"use client";

import React, { useState, useCallback } from "react";
import { PoolDetail as PoolDetailType, UserRole } from "@/lib/types/domain";
import { fetchPoolDetail, executeLeavePool } from "@/features/commercial/client-service";
import { formatCategoryName, formatHeads } from "@/features/commercial/formatters";
import { getPoolStatusPresentation } from "@/features/commercial/presentation";
import { getOfferConfirmationStats } from "@/features/commercial/view-models";
import { PoolProgress } from "./PoolProgress";
import { PoolStatusBadge } from "./PoolStatusBadge";
import { PoolMembers } from "./PoolMembers";
import { PoolTimeline } from "./PoolTimeline";
import { JoinPoolDialog } from "./JoinPoolDialog";
import { OfferForm } from "../offers/OfferForm";
import { OfferCard } from "../offers/OfferCard";
import { OfferConfirmation } from "../offers/OfferConfirmation";
import { ConfirmationProgress } from "../offers/ConfirmationProgress";
import { OperatorPoolPanel } from "../operator/OperatorPoolPanel";
import {
  MapPin,
  Tag,
  PlusCircle,
  Clock,
  History,
  Users,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface PoolDetailProps {
  initialPool: PoolDetailType;
  currentUserId?: string;
  userRole?: UserRole;
  className?: string;
}

export function PoolDetail({
  initialPool,
  currentUserId,
  userRole = "productor",
  className = "",
}: PoolDetailProps) {
  const [pool, setPool] = useState<PoolDetailType>(initialPool);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"members" | "offers" | "timeline">("members");

  const statusPresentation = getPoolStatusPresentation(pool.status);

  // Recarga atómica del estado desde el backend
  const refreshPool = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchPoolDetail(pool.id);
      if (res.data) {
        setPool(res.data);
      }
    } catch (err) {
      console.error("Error al actualizar detalle del pool:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [pool.id]);

  // Manejo de retiro de lote propio (Módulo D)
  const handleLeaveLot = async (lotId: string) => {
    const res = await executeLeavePool(pool.id, lotId);
    if (res.error) {
      throw new Error(res.error.message || "Error al retirar lote.");
    }
    await refreshPool();
  };

  // Identificar si el usuario actual es productor con lote en este pool
  const userHasLotInPool = Boolean(
    currentUserId &&
      pool.members.some(
        (m) =>
          m.lot?.producer_id === currentUserId ||
          m.lot?.producer?.id === currentUserId
      )
  );

  const confirmationStats = getOfferConfirmationStats(
    pool.active_offer,
    pool.members,
    currentUserId
  );

  const canJoin = pool.status === "abierto" && pool.current_heads < pool.target_heads;
  const canOffer = userRole === "comprador" && pool.status === "objetivo_alcanzado";
  const hasActiveOffer = Boolean(pool.active_offer);

  return (
    <div className={`space-y-6 max-w-5xl mx-auto ${className}`}>
      {/* Tarjeta de Encabezado Principal */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 font-medium">
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-md">
                <Tag className="w-4 h-4 text-gray-500" />
                {formatCategoryName(pool.category)}
              </span>
              <span className="inline-flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-500" />
                {pool.zone}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {pool.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <PoolStatusBadge status={pool.status} className="text-sm px-3.5 py-1.5" />
            <button
              type="button"
              onClick={refreshPool}
              disabled={isRefreshing}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Actualizar datos"
              aria-label="Actualizar datos del pool"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mensaje descriptivo del estado */}
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/80 space-y-1">
          <p className="text-base font-bold text-gray-900">{statusPresentation.description}</p>
          <p className="text-sm text-gray-600">{statusPresentation.hint}</p>
        </div>

        {/* Barra de progreso de cabezas */}
        <div className="pt-2">
          <PoolProgress
            currentHeads={pool.current_heads}
            targetHeads={pool.target_heads}
            showDetails={true}
            size="lg"
          />
        </div>

        {/* Botón de acción principal para Productores: Sumar mis animales */}
        {userRole === "productor" && canJoin && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
            <div>
              <h4 className="text-base font-bold text-emerald-950">
                ¿Tenés {formatCategoryName(pool.category).toLowerCase()}s disponibles en {pool.zone}?
              </h4>
              <p className="text-sm text-emerald-800">
                Sumá tu lote para completar las {formatHeads(pool.target_heads - pool.current_heads)} restantes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsJoinDialogOpen(true)}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-base font-bold shadow-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Sumar mis animales</span>
            </button>
          </div>
        )}
      </section>

      {/* Panel del Operador si el usuario es operador */}
      {userRole === "operador" && (
        <section aria-label="Sección de Operador">
          <OperatorPoolPanel
            pool={pool}
            currentUserId={currentUserId}
            userRole="operador"
            onOperationClosed={refreshPool}
          />
        </section>
      )}

      {/* Formulario de Oferta para Compradores si el pool alcanzó el objetivo */}
      {canOffer && (
        <section aria-label="Presentar Oferta Comercial">
          <OfferForm pool={pool} onOfferCreated={refreshPool} />
        </section>
      )}

      {/* Panel de Decisión y Confirmación para el Productor con lote en pool en negociación */}
      {userHasLotInPool && pool.active_offer && pool.status === "en_negociacion" && (
        <section aria-label="Confirmación de Propuesta">
          <OfferConfirmation
            offer={pool.active_offer}
            userConfirmation={confirmationStats.userConfirmation}
            isParticipant={true}
            onDecisionSubmitted={refreshPool}
          />
        </section>
      )}

      {/* Pestañas de Navegación de Detalle */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`min-h-[48px] px-5 py-3 text-sm sm:text-base font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "members"
                ? "border-emerald-600 text-emerald-800 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lotes y Productores ({pool.members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("offers")}
            className={`min-h-[48px] px-5 py-3 text-sm sm:text-base font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "offers"
                ? "border-emerald-600 text-emerald-800 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Propuestas Comerciales {hasActiveOffer ? "(1)" : "(0)"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`min-h-[48px] px-5 py-3 text-sm sm:text-base font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "timeline"
                ? "border-emerald-600 text-emerald-800 bg-white"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial Comercial</span>
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="p-6">
          {activeTab === "members" && (
            <PoolMembers
              members={pool.members}
              currentUserId={currentUserId}
              poolStatus={pool.status}
              hasActiveOffer={hasActiveOffer}
              onLeaveLot={handleLeaveLot}
            />
          )}

          {activeTab === "offers" && (
            <div className="space-y-5">
              {pool.active_offer ? (
                <>
                  <OfferCard offer={pool.active_offer} isActive={true} />
                  <ConfirmationProgress stats={confirmationStats} />
                </>
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  {pool.status === "abierto"
                    ? "Esta venta conjunta está reuniendo animales. Cuando alcance las 400 cabezas podrá recibir ofertas."
                    : "No se registran ofertas activas en este momento."}
                </div>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <PoolTimeline events={pool.history || []} />
          )}
        </div>
      </section>

      {/* Diálogo modal para Sumar Lote */}
      <JoinPoolDialog
        isOpen={isJoinDialogOpen}
        onClose={() => setIsJoinDialogOpen(false)}
        pool={pool}
        onJoinSuccess={refreshPool}
      />
    </div>
  );
}
