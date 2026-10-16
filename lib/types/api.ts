/**
 * YVYPASS — API Types
 * Contratos de respuesta estandarizados y filtros de consulta.
 */

import { LivestockCategory, LotStatus, PoolStatus } from "./domain";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
}

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "CONCURRENCY_ERROR"
  | "BUSINESS_RULE_VIOLATION"
  | "INTERNAL_ERROR";

export interface LotFilters {
  category?: LivestockCategory;
  zone?: string;
  status?: LotStatus;
  min_heads?: number;
  max_heads?: number;
  producer_id?: string;
}

export interface PoolFilters {
  category?: LivestockCategory;
  zone?: string;
  status?: PoolStatus;
}
