import { createClient } from "@/lib/supabase/server";
import {
  PoolSummary,
  PoolDetail,
  CommercialEvent,
  PoolMemberDetail,
  Offer,
  OfferConfirmation,
} from "@/lib/types/domain";
import { ApiResult, PoolFilters } from "@/lib/types/api";
import { successResult, errorResult, handleCatchError } from "@/lib/utils/api-error";
import { poolFiltersSchema } from "@/lib/validators/pools";

/**
 * Consulta la lista de pools de venta con cálculo dinámico de cabezas y conteo de miembros.
 */
export async function getPools(
  filters?: PoolFilters,
  clientOverride?: any
): Promise<ApiResult<PoolSummary[]>> {
  try {
    if (filters) {
      const parsedFilters = poolFiltersSchema.safeParse(filters);
      if (!parsedFilters.success) {
        return errorResult(
          "VALIDATION_ERROR",
          "Filtros de consulta de pools no válidos.",
          parsedFilters.error.format()
        );
      }
    }

    const supabase = clientOverride || (await createClient());
    let query = supabase
      .from("sales_pools")
      .select(`
        *,
        members:pool_members (
          id,
          lot:livestock_lots (
            id,
            head_count
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.zone) {
      query = query.ilike("zone", `%${filters.zone}%`);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data: pools, error } = await query;

    if (error) {
      return errorResult("INTERNAL_ERROR", "Error al consultar los pools de venta.", error.message);
    }

    const formattedPools: PoolSummary[] = (pools || []).map((p: any) => {
      const membersList = p.members || [];
      const current_heads = membersList.reduce((acc: number, m: any) => {
        return acc + (m.lot?.head_count || 0);
      }, 0);

      return {
        id: p.id,
        title: p.title,
        zone: p.zone,
        category: p.category,
        target_heads: p.target_heads,
        status: p.status,
        created_by: p.created_by,
        created_at: p.created_at,
        current_heads,
        members_count: membersList.length,
      };
    });

    return successResult(formattedPools);
  } catch (error) {
    return handleCatchError(error, "Error al consultar pools de venta.");
  }
}

/**
 * Consulta el detalle completo de un pool, incluyendo miembros, cabezas calculadas, oferta y trazabilidad.
 */
export async function getPoolDetail(
  id: string,
  clientOverride?: any
): Promise<ApiResult<PoolDetail>> {
  try {
    const supabase = clientOverride || (await createClient());

    // 1. Datos del pool y miembros
    const { data: pool, error: poolError } = await supabase
      .from("sales_pools")
      .select(`
        *,
        members:pool_members (
          id,
          pool_id,
          lot_id,
          joined_at,
          lot:livestock_lots (
            *,
            farm:farms (
              id,
              name,
              zone,
              province
            ),
            producer:profiles (
              id,
              full_name
            )
          )
        )
      `)
      .eq("id", id)
      .single();

    if (poolError || !pool) {
      return errorResult("NOT_FOUND", "El pool solicitado no existe.");
    }

    // 2. Cabezas actuales calculadas
    const membersList = (pool.members || []) as any[];
    const current_heads = membersList.reduce((acc: number, m: any) => {
      return acc + (m.lot?.head_count || 0);
    }, 0);

    // 3. Oferta activa
    const { data: offers } = await supabase
      .from("offers")
      .select(`
        *,
        buyer:profiles (
          id,
          full_name
        ),
        confirmations:offer_confirmations (
          *,
          producer:profiles (
            id,
            full_name
          )
        )
      `)
      .eq("pool_id", id)
      .order("created_at", { ascending: false })
      .limit(1);

    const activeOffer = offers && offers.length > 0 ? offers[0] : null;

    // 4. Historial de eventos comerciales
    const { data: history } = await supabase
      .from("commercial_events")
      .select(`
        *,
        actor:profiles (
          id,
          full_name,
          role
        )
      `)
      .eq("pool_id", id)
      .order("created_at", { ascending: true });

    const detail: PoolDetail = {
      id: pool.id,
      title: pool.title,
      zone: pool.zone,
      category: pool.category,
      target_heads: pool.target_heads,
      status: pool.status,
      created_by: pool.created_by,
      created_at: pool.created_at,
      current_heads,
      members: membersList as PoolMemberDetail[],
      active_offer: activeOffer as any,
      history: (history || []) as CommercialEvent[],
    };

    return successResult(detail);
  } catch (error) {
    return handleCatchError(error, "Error al consultar el detalle del pool.");
  }
}

/**
 * Consulta el historial de eventos comerciales de un pool.
 */
export async function getCommercialHistory(
  poolId: string,
  clientOverride?: any
): Promise<ApiResult<CommercialEvent[]>> {
  try {
    const supabase = clientOverride || (await createClient());
    const { data: events, error } = await supabase
      .from("commercial_events")
      .select(`
        *,
        actor:profiles (
          id,
          full_name,
          role
        )
      `)
      .eq("pool_id", poolId)
      .order("created_at", { ascending: true });

    if (error) {
      return errorResult("INTERNAL_ERROR", "Error al consultar el historial.", error.message);
    }

    return successResult((events || []) as CommercialEvent[]);
  } catch (error) {
    return handleCatchError(error, "Error al consultar eventos comerciales.");
  }
}
