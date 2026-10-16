"use client";

import React from "react";
import { PoolStatus } from "@/lib/types/domain";
import { getPoolStatusPresentation } from "@/features/commercial/presentation";

interface PoolStatusBadgeProps {
  status: PoolStatus;
  className?: string;
  showDot?: boolean;
}

export function PoolStatusBadge({
  status,
  className = "",
  showDot = true,
}: PoolStatusBadgeProps) {
  const presentation = getPoolStatusPresentation(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${presentation.badgeClass} ${className}`}
      role="status"
      aria-label={`Estado: ${presentation.label}`}
    >
      {showDot && (
        <span
          className={`h-2 w-2 rounded-full ${presentation.dotClass}`}
          aria-hidden="true"
        />
      )}
      <span>{presentation.label}</span>
    </span>
  );
}
