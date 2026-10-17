import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { getPools, getPoolDetail, getCommercialHistory } from "@/features/pools/queries";
import { joinPool, leavePool } from "@/features/pools/mutations";
import { getMyLots } from "@/features/lots/queries";
import { createOffer, confirmOffer, closePool } from "@/features/offers/mutations";
import { getPoolOffers } from "@/features/offers/queries";
import {
  PoolSummary,
  PoolDetail,
  LivestockLotWithFarm,
  Offer,
  CommercialEvent,
  CreateOfferInput,
  Profile,
} from "@/lib/types/domain";
import { ApiResult, PoolFilters } from "@/lib/types/api";

/**
 * Obtiene una instancia segura del cliente Supabase en el navegador.
 */
export function getBrowserClient() {
  try {
    return createBrowserClient();
  } catch (error) {
    console.warn("No se pudo inicializar el cliente browser de Supabase:", error);
    return null;
  }
}

/**
 * Obtiene el perfil del usuario actual desde la sesión activa en el navegador.
 */
export async function fetchCurrentProfile(): Promise<ApiResult<Profile>> {
  try {
    const supabase = getBrowserClient();
    if (!supabase) {
      return {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Cliente Supabase no disponible." },
      };
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Sesión requerida." },
      };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return {
        data: null,
        error: { code: "NOT_FOUND", message: "Perfil de usuario no encontrado." },
      };
    }

    return { data: profile as Profile, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: { code: "INTERNAL_ERROR", message: err.message || "Error al obtener perfil." },
    };
  }
}

/**
 * Consulta listado de pools pasando el cliente del navegador.
 */
export async function fetchPools(filters?: PoolFilters): Promise<ApiResult<PoolSummary[]>> {
  const client = getBrowserClient();
  return getPools(filters, client);
}

/**
 * Consulta detalle de un pool pasando el cliente del navegador.
 */
export async function fetchPoolDetail(poolId: string): Promise<ApiResult<PoolDetail>> {
  const client = getBrowserClient();
  return getPoolDetail(poolId, client);
}

/**
 * Consulta los lotes del productor autenticado.
 */
export async function fetchMyLots(): Promise<ApiResult<LivestockLotWithFarm[]>> {
  const client = getBrowserClient();
  return getMyLots(client);
}

/**
 * Adhiere un lote propio a un pool.
 */
export async function executeJoinPool(poolId: string, lotId: string) {
  const client = getBrowserClient();
  return joinPool(poolId, lotId, client);
}

/**
 * Retira un lote de un pool abierto.
 */
export async function executeLeavePool(poolId: string, lotId: string) {
  const client = getBrowserClient();
  return leavePool(poolId, lotId, client);
}

/**
 * Registra una oferta indicativa de comprador.
 */
export async function executeCreateOffer(poolId: string, input: CreateOfferInput) {
  const client = getBrowserClient();
  return createOffer(poolId, input, client);
}

/**
 * Consulta ofertas asociadas al pool.
 */
export async function fetchPoolOffers(poolId: string): Promise<ApiResult<Offer[]>> {
  const client = getBrowserClient();
  return getPoolOffers(poolId, client);
}

/**
 * Registra la confirmación o rechazo de un productor sobre una oferta.
 */
export async function executeConfirmOffer(offerId: string, accepted: boolean) {
  const client = getBrowserClient();
  return confirmOffer(offerId, accepted, client);
}

/**
 * Cierre comercial demostrativo por operador.
 */
export async function executeClosePool(poolId: string) {
  const client = getBrowserClient();
  return closePool(poolId, client);
}

/**
 * Consulta historial de eventos comerciales.
 */
export async function fetchCommercialHistory(
  poolId: string
): Promise<ApiResult<CommercialEvent[]>> {
  const client = getBrowserClient();
  return getCommercialHistory(poolId, client);
}
