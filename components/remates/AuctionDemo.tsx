"use client";

import React, { useState, useEffect } from "react";
import { AuctionLotCard, SimulatedAuctionLot } from "./AuctionLotCard";
import { formatPricePerKg } from "@/features/commercial/formatters";
import { Gavel, Clock, ShieldAlert, Award, ArrowUpRight } from "lucide-react";

interface SimulatedBid {
  id: string;
  bidder: string;
  pricePerKg: number;
  timeFormatted: string;
}

const INITIAL_LOT: SimulatedAuctionLot = {
  id: "sim-lot-001",
  title: "Venta Conjunta: 400 Novillos Braford Marca Líquida",
  category: "Novillo",
  breed: "Braford NEA",
  heads: 400,
  averageWeightKg: 395,
  location: "Curuzú Cuatiá, Corrientes",
  farm: "Agrupación 4 Productores YvyPass",
  basePricePerKg: 2800,
  currentBidPerKg: 2950,
  bidsCount: 4,
  status: "activo",
};

const INITIAL_BIDS: SimulatedBid[] = [
  { id: "b-4", bidder: "Frigorífico del Litoral (Comprador 1)", pricePerKg: 2950, timeFormatted: "Hace 15 seg" },
  { id: "b-3", bidder: "Carnes Correntinas SA (Comprador 2)", pricePerKg: 2900, timeFormatted: "Hace 1 min" },
  { id: "b-2", bidder: "Frigorífico del Litoral", pricePerKg: 2850, timeFormatted: "Hace 2 min" },
  { id: "b-1", bidder: "Invernada del Iberá", pricePerKg: 2800, timeFormatted: "Hace 3 min" },
];

export function AuctionDemo() {
  const [lot, setLot] = useState<SimulatedAuctionLot>(INITIAL_LOT);
  const [bids, setBids] = useState<SimulatedBid[]>(INITIAL_BIDS);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(165); // 2m 45s

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const handleSimulateBid = () => {
    const newPrice = lot.currentBidPerKg + 50;
    const newBid: SimulatedBid = {
      id: `b-${Date.now()}`,
      bidder: "Tu Empresa Ganadera (Puja simulada)",
      pricePerKg: newPrice,
      timeFormatted: "Recién",
    };

    setLot((prev) => ({
      ...prev,
      currentBidPerKg: newPrice,
      bidsCount: prev.bidsCount + 1,
    }));

    setBids((prev) => [newBid, ...prev]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner de advertencia de simulación */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3.5 text-amber-950 text-sm shadow-sm">
        <ShieldAlert className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-base text-amber-900">
            Demostración de Remate Virtual Simulado
          </h4>
          <p className="leading-relaxed">
            Esta pantalla es una maqueta interactiva diseñada para ilustrar el potencial de subastas ganaderas virtuales. <strong>No constituye un remate habilitado ni liquida operaciones comerciales reales</strong>. Las pujas mostradas son datos locales de demostración.
          </p>
        </div>
      </div>

      {/* Reloj del martillero */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Gavel className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Martillero en línea (Simulación)
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">Lote 01 — En vivo</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 px-6 py-3 rounded-2xl border border-slate-700">
          <Clock className="w-6 h-6 text-amber-400" />
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Tiempo restante:</span>
            <span className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-white">
              {timeFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta del lote */}
      <AuctionLotCard lot={lot} onPlaceBid={handleSimulateBid} />

      {/* Historial de pujas simuladas */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
            <Award className="w-5 h-5 text-amber-600" />
            <span>Pujas simuladas recientes</span>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {lot.bidsCount} ofertas registradas
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {bids.map((b, idx) => (
            <div
              key={b.id}
              className={`py-3 flex items-center justify-between gap-3 text-sm ${
                idx === 0 ? "font-bold text-emerald-900 bg-emerald-50/50 px-2 rounded-lg" : "text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {idx === 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                    Punta
                  </span>
                )}
                <span>{b.bidder}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-base text-emerald-800">{formatPricePerKg(b.pricePerKg)}</span>
                <span className="text-xs text-gray-400">{b.timeFormatted}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
