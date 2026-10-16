import { ApiResult, ApiError } from "@/lib/types/api";

export function successResult<T>(data: T): ApiResult<T> {
  return {
    data,
    error: null,
  };
}

export function errorResult<T>(
  code: string,
  message: string,
  details?: unknown
): ApiResult<T> {
  return {
    data: null,
    error: {
      code,
      message,
      details,
    },
  };
}

export function handleCatchError<T>(err: unknown, defaultMessage = "Error inesperado del servidor"): ApiResult<T> {
  if (err instanceof Error) {
    return errorResult<T>("INTERNAL_ERROR", err.message || defaultMessage);
  }
  return errorResult<T>("INTERNAL_ERROR", defaultMessage, err);
}
