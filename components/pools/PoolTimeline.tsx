"use client";

import React from "react";
import { CommercialEvent } from "@/lib/types/domain";
import { formatCommercialEventText } from "@/features/commercial/presentation";
import { formatCommercialDate } from "@/features/commercial/formatters";
import {
  Sparkles,
  PlusCircle,
  MinusCircle,
  Trophy,
  DollarSign,
  CheckCircle2,
  XCircle,
  Lock,
  Clock,
} from "lucide-react";

interface PoolTimelineProps {
  events: CommercialEvent[];
  className?: string;
}

export function PoolTimeline({ events = [], className = "" }: PoolTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-xl border border-gray-200 text-center text-gray-500 text-sm ${className}`}>
        No hay registros en el historial comercial de este pool todavía.
      </div>
    );
  }

  const getEventIcon = (type: CommercialEvent["event_type"]) => {
    switch (type) {
      case "pool_created":
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case "lot_joined":
        return <PlusCircle className="w-4 h-4 text-emerald-600" />;
      case "lot_left":
        return <MinusCircle className="w-4 h-4 text-amber-600" />;
      case "pool_target_reached":
        return <Trophy className="w-4 h-4 text-amber-600" />;
      case "offer_created":
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case "offer_confirmed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "offer_rejected":
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case "pool_closed":
        return <Lock className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventBadgeClass = (type: CommercialEvent["event_type"]) => {
    switch (type) {
      case "pool_target_reached":
        return "bg-amber-100 border-amber-300";
      case "pool_closed":
        return "bg-purple-100 border-purple-300";
      case "offer_created":
        return "bg-blue-100 border-blue-300";
      case "offer_rejected":
        return "bg-rose-100 border-rose-300";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <ol className="relative border-l border-gray-200 ml-3 space-y-6">
        {events.map((event) => {
          const { title, subtitle } = formatCommercialEventText(
            event.event_type,
            event.details,
            event.actor?.full_name
          );

          return (
            <li key={event.id} className="ml-6">
              <span
                className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full border shadow-sm ${getEventBadgeClass(
                  event.event_type
                )}`}
              >
                {getEventIcon(event.event_type)}
              </span>

              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h4 className="text-sm sm:text-base font-bold text-gray-900">{title}</h4>
                  <time className="text-xs text-gray-500 font-medium">
                    {formatCommercialDate(event.created_at)}
                  </time>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{subtitle}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
