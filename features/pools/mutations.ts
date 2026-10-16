import { createClient } from "@/lib/supabase/server";
import { SalesPool, CreatePoolInput, PoolStatus } from "@/lib/types/domain";
import { ApiResult } from "@/lib/types/api";
import { successResult, errorResult, handleCatchError } from "@/lib/utils/api-error";
import { createPoolSchema, joinPoolSchema, leavePoolSchema } from "@/lib/validators/pools";

/**
 * Crea un nuevo pool de venta conjunta.
 * Autorizado para operadores y productores.
 */
export async function createPool(
  input: CreatePoolInput,
  clientOverride?: any
): Promise<ApiResult<SalesPool>> {
  try {
    const parsed = createPoolSchema.safeParse(input);
    if (!parsed.success) {
      return errorResult(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message || "Datos del pool no válidos.",
        parsed.error.format()
      );
    }

    const supabase = clientOverride || (await createClient());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResult("UNAUTHORIZED", "Sesión requerida.");
    }

    // Verificar rol
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "operador" && profile.role !== "productor")) {
      return errorResult("FORBIDDEN", "No tiene permisos para crear pools de venta.");
    }

    const { data: pool, error: insertError } = await supabase
      .from("sales_pools")
      .insert({
        title: parsed.data.title,
        zone: parsed.data.zone,
        category: parsed.data.category,
        target_heads: parsed.data.target_heads,
        status: "abierto",
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return errorResult("INTERNAL_ERROR", "Error al crear el pool.", insertError.message);
    }

    // Registrar evento comercial
    await supabase.from("commercial_events").insert({
      pool_id: pool.id,
      actor_id: user.id,
      event_type: "pool_created",
      details: {
        title: pool.title,
        target_heads: pool.target_heads,
        category: pool.category,
        zone: pool.zone,
      },
    });

    return successResult(pool as SalesPool);
  } catch (error) {
    return handleCatchError(error, "Error al crear pool de venta.");
  }
}

/**
 * Adhiere un lote propio a un pool compatible mediante transacción atómica en PostgreSQL.
 */
export async function joinPool(
  poolId: string,
  lotId: string,
  clientOverride?: any
): Promise<
  ApiResult<{
    success: boolean;
    current_heads: number;
    target_heads: number;
    pool_status: PoolStatus;
  }>
> {
  try {
    const parsed = joinPoolSchema.safeParse({ pool_id: poolId, lot_id: lotId });
    if (!parsed.success) {
      return errorResult(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message || "Parámetros de adhesión no válidos.",
        parsed.error.format()
      );
    }

    const supabase = clientOverride || (await createClient());

    const { data, error } = await supabase.rpc("rpc_join_pool", {
      p_pool_id: poolId,
      p_lot_id: lotId,
    });

    if (error) {
      return errorResult(
        "BUSINESS_RULE_VIOLATION",
        error.message || "No se pudo adherir el lote al pool."
      );
    }

    const res = data as any;
    return successResult({
      success: res.success,
      current_heads: res.current_heads,
      target_heads: res.target_heads,
      pool_status: res.pool_status as PoolStatus,
    });
  } catch (error) {
    return handleCatchError(error, "Error en la adhesión al pool.");
  }
}

/**
 * Retira un lote propio de un pool abierto mediante transacción atómica en PostgreSQL.
 */
export async function leavePool(
  poolId: string,
  lotId: string,
  clientOverride?: any
): Promise<
  ApiResult<{
    success: boolean;
    current_heads: number;
    pool_status: PoolStatus;
  }>
> {
  try {
    const parsed = leavePoolSchema.safeParse({ pool_id: poolId, lot_id: lotId });
    if (!parsed.success) {
      return errorResult(
        "VALIDATION_ERROR",
        parsed.error.errors[0]?.message || "Parámetros de retiro no válidos.",
        parsed.error.format()
      );
    }

    const supabase = clientOverride || (await createClient());

    const { data, error } = await supabase.rpc("rpc_leave_pool", {
      p_pool_id: poolId,
      p_lot_id: lotId,
    });

    if (error) {
      return errorResult(
        "BUSINESS_RULE_VIOLATION",
        error.message || "No se pudo retirar el lote del pool."
      );
    }

    const res = data as any;
    return successResult({
      success: res.success,
      current_heads: res.current_heads,
      pool_status: res.pool_status as PoolStatus,
    });
  } catch (error) {
    return handleCatchError(error, "Error al retirar lote del pool.");
  }
}
