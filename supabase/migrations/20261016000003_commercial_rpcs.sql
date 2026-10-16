-- ==============================================================================
-- YVYPASS — MIGRACIÓN 3: FUNCIONES COMERCIALES TRANSACCIONALES (RPCs)
-- Ideathon Corrientes 2026
-- ==============================================================================

-- 1. RPC: join_pool (Adhesión atómica de lote a pool)
CREATE OR REPLACE FUNCTION public.rpc_join_pool(
    p_pool_id UUID,
    p_lot_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_role user_role;
    v_pool RECORD;
    v_lot RECORD;
    v_farm_zone TEXT;
    v_current_heads INTEGER := 0;
    v_new_total INTEGER := 0;
    v_new_pool_status pool_status;
BEGIN
    -- 1. Autenticación
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    -- 2. Rol
    SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
    IF v_role != 'productor' THEN
        RAISE EXCEPTION 'Solo los productores pueden adherir lotes a un pool.';
    END IF;

    -- 3. Bloqueo y verificación del lote
    SELECT * INTO v_lot FROM public.livestock_lots
    WHERE id = p_lot_id
    FOR UPDATE;

    IF v_lot IS NULL THEN
        RAISE EXCEPTION 'El lote especificado no existe.';
    END IF;

    IF v_lot.producer_id != v_user_id THEN
        RAISE EXCEPTION 'No tiene permisos sobre este lote.';
    END IF;

    IF v_lot.status != 'disponible' THEN
        RAISE EXCEPTION 'El lote no se encuentra disponible (estado actual: %).', v_lot.status;
    END IF;

    -- 4. Bloqueo y verificación del pool
    SELECT * INTO v_pool FROM public.sales_pools
    WHERE id = p_pool_id
    FOR UPDATE;

    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'El pool de venta especificado no existe.';
    END IF;

    IF v_pool.status != 'abierto' THEN
        RAISE EXCEPTION 'El pool no está abierto para recibir adhesiones (estado actual: %).', v_pool.status;
    END IF;

    -- 5. Compatibilidad de Categoría
    IF v_lot.category != v_pool.category THEN
        RAISE EXCEPTION 'Categoría incompatible: el pool requiere % pero el lote es %.',
            v_pool.category, v_lot.category;
    END IF;

    -- 6. Compatibilidad de Zona
    SELECT zone INTO v_farm_zone FROM public.farms WHERE id = v_lot.farm_id;
    IF v_farm_zone IS NULL OR LOWER(TRIM(v_farm_zone)) != LOWER(TRIM(v_pool.zone)) THEN
        RAISE EXCEPTION 'Zona incompatible: el pool es de zona "%" y el establecimiento es de zona "%".',
            v_pool.zone, COALESCE(v_farm_zone, 'Desconocida');
    END IF;

    -- 7. Comprobar que no esté ya en un pool activo
    IF EXISTS (
        SELECT 1 FROM public.pool_members pm
        JOIN public.sales_pools sp ON sp.id = pm.pool_id
        WHERE pm.lot_id = p_lot_id AND sp.status IN ('abierto', 'objetivo_alcanzado', 'en_negociacion')
    ) THEN
        RAISE EXCEPTION 'El lote ya se encuentra adherido a un pool activo.';
    END IF;

    -- 8. Calcular cabezas actuales del pool
    SELECT COALESCE(SUM(l.head_count), 0) INTO v_current_heads
    FROM public.pool_members pm
    JOIN public.livestock_lots l ON l.id = pm.lot_id
    WHERE pm.pool_id = p_pool_id;

    v_new_total := v_current_heads + v_lot.head_count;

    IF v_new_total > v_pool.target_heads THEN
        RAISE EXCEPTION 'La adhesión de % cabezas superaría el objetivo del pool (% de % cabezas).',
            v_lot.head_count, v_new_total, v_pool.target_heads;
    END IF;

    -- 9. Insertar adhesión
    INSERT INTO public.pool_members (pool_id, lot_id)
    VALUES (p_pool_id, p_lot_id);

    -- 10. Reservar el lote
    UPDATE public.livestock_lots
    SET status = 'reservado'
    WHERE id = p_lot_id;

    -- 11. Determinar nuevo estado del pool
    v_new_pool_status := v_pool.status;
    IF v_new_total = v_pool.target_heads THEN
        v_new_pool_status := 'objetivo_alcanzado';
        UPDATE public.sales_pools
        SET status = 'objetivo_alcanzado'
        WHERE id = p_pool_id;

        -- Evento de objetivo alcanzado
        INSERT INTO public.commercial_events (pool_id, actor_id, event_type, details)
        VALUES (
            p_pool_id,
            v_user_id,
            'pool_target_reached',
            jsonb_build_object(
                'target_heads', v_pool.target_heads,
                'current_heads', v_new_total,
                'message', 'El pool ha alcanzado su objetivo de cabezas'
            )
        );
    END IF;

    -- 12. Registrar evento de adhesión
    INSERT INTO public.commercial_events (pool_id, actor_id, event_type, details)
    VALUES (
        p_pool_id,
        v_user_id,
        'lot_joined',
        jsonb_build_object(
            'lot_id', p_lot_id,
            'producer_id', v_user_id,
            'head_count', v_lot.head_count,
            'total_heads_now', v_new_total,
            'target_heads', v_pool.target_heads
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Lote adherido exitosamente al pool.',
        'current_heads', v_new_total,
        'target_heads', v_pool.target_heads,
        'pool_status', v_new_pool_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. RPC: leave_pool (Retiro de lote de pool abierto)
CREATE OR REPLACE FUNCTION public.rpc_leave_pool(
    p_pool_id UUID,
    p_lot_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_pool RECORD;
    v_lot RECORD;
    v_current_heads INTEGER := 0;
    v_new_pool_status pool_status;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    -- Bloqueo del pool
    SELECT * INTO v_pool FROM public.sales_pools
    WHERE id = p_pool_id
    FOR UPDATE;

    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'El pool especificado no existe.';
    END IF;

    IF v_pool.status NOT IN ('abierto', 'objetivo_alcanzado') THEN
        RAISE EXCEPTION 'No se puede retirar un lote de un pool en negociación o cerrado.';
    END IF;

    -- Verificar que no haya ofertas activas
    IF EXISTS (
        SELECT 1 FROM public.offers
        WHERE pool_id = p_pool_id AND status = 'pendiente'
    ) THEN
        RAISE EXCEPTION 'No se pueden retirar lotes mientras existe una oferta activa en evaluación.';
    END IF;

    -- Bloqueo del lote
    SELECT * INTO v_lot FROM public.livestock_lots
    WHERE id = p_lot_id
    FOR UPDATE;

    IF v_lot IS NULL OR v_lot.producer_id != v_user_id THEN
        RAISE EXCEPTION 'No tiene permisos para retirar este lote.';
    END IF;

    -- Verificar pertenencia al pool
    IF NOT EXISTS (
        SELECT 1 FROM public.pool_members
        WHERE pool_id = p_pool_id AND lot_id = p_lot_id
    ) THEN
        RAISE EXCEPTION 'El lote no forma parte de este pool.';
    END IF;

    -- Eliminar membresía
    DELETE FROM public.pool_members
    WHERE pool_id = p_pool_id AND lot_id = p_lot_id;

    -- Liberar lote
    UPDATE public.livestock_lots
    SET status = 'disponible'
    WHERE id = p_lot_id;

    -- Recalcular total de cabezas
    SELECT COALESCE(SUM(l.head_count), 0) INTO v_current_heads
    FROM public.pool_members pm
    JOIN public.livestock_lots l ON l.id = pm.lot_id
    WHERE pm.pool_id = p_pool_id;

    -- Si estaba en objetivo_alcanzado, vuelve a abierto
    v_new_pool_status := v_pool.status;
    IF v_pool.status = 'objetivo_alcanzado' AND v_current_heads < v_pool.target_heads THEN
        v_new_pool_status := 'abierto';
        UPDATE public.sales_pools
        SET status = 'abierto'
        WHERE id = p_pool_id;
    END IF;

    -- Evento
    INSERT INTO public.commercial_events (pool_id, actor_id, event_type, details)
    VALUES (
        p_pool_id,
        v_user_id,
        'lot_left',
        jsonb_build_object(
            'lot_id', p_lot_id,
            'head_count', v_lot.head_count,
            'current_heads', v_current_heads
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Lote retirado del pool.',
        'current_heads', v_current_heads,
        'pool_status', v_new_pool_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC: create_offer (Oferta indicativa de comprador)
CREATE OR REPLACE FUNCTION public.rpc_create_offer(
    p_pool_id UUID,
    p_price_per_kg NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_role user_role;
    v_pool RECORD;
    v_offer_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
    IF v_role != 'comprador' THEN
        RAISE EXCEPTION 'Solo los compradores pueden presentar ofertas indicativas.';
    END IF;

    IF p_price_per_kg <= 0 THEN
        RAISE EXCEPTION 'El precio por kg debe ser mayor a 0.';
    END IF;

    -- Bloqueo del pool
    SELECT * INTO v_pool FROM public.sales_pools
    WHERE id = p_pool_id
    FOR UPDATE;

    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'El pool especificado no existe.';
    END IF;

    IF v_pool.status != 'objetivo_alcanzado' THEN
        RAISE EXCEPTION 'El pool debe haber alcanzado su objetivo para recibir ofertas (estado: %).', v_pool.status;
    END IF;

    -- Verificar que no haya oferta pendiente
    IF EXISTS (
        SELECT 1 FROM public.offers
        WHERE pool_id = p_pool_id AND status = 'pendiente'
    ) THEN
        RAISE EXCEPTION 'Ya existe una oferta activa en evaluación para este pool.';
    END IF;

    -- Insertar oferta
    INSERT INTO public.offers (pool_id, buyer_id, price_per_kg, status)
    VALUES (p_pool_id, v_user_id, p_price_per_kg, 'pendiente')
    RETURNING id INTO v_offer_id;

    -- Pasar pool a negociación
    UPDATE public.sales_pools
    SET status = 'en_negociacion'
    WHERE id = p_pool_id;

    -- Registrar evento
    INSERT INTO public.commercial_events (pool_id, actor_id, event_type, details)
    VALUES (
        p_pool_id,
        v_user_id,
        'offer_created',
        jsonb_build_object(
            'offer_id', v_offer_id,
            'buyer_id', v_user_id,
            'price_per_kg', p_price_per_kg
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'offer_id', v_offer_id,
        'message', 'Oferta indicativa registrada exitosamente.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: confirm_offer (Confirmación de productor participante)
CREATE OR REPLACE FUNCTION public.rpc_confirm_offer(
    p_offer_id UUID,
    p_accepted BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_role user_role;
    v_offer RECORD;
    v_total_producers INTEGER := 0;
    v_confirmed_producers INTEGER := 0;
    v_all_confirmed BOOLEAN := false;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
    IF v_role != 'productor' THEN
        RAISE EXCEPTION 'Solo los productores participantes pueden confirmar ofertas.';
    END IF;

    -- Bloqueo de oferta
    SELECT * INTO v_offer FROM public.offers
    WHERE id = p_offer_id
    FOR UPDATE;

    IF v_offer IS NULL THEN
        RAISE EXCEPTION 'La oferta especificada no existe.';
    END IF;

    IF v_offer.status != 'pendiente' THEN
        RAISE EXCEPTION 'La oferta ya fue resuelta (estado actual: %).', v_offer.status;
    END IF;

    -- Verificar que el productor tiene lote en el pool
    IF NOT EXISTS (
        SELECT 1 FROM public.pool_members pm
        JOIN public.livestock_lots l ON l.id = pm.lot_id
        WHERE pm.pool_id = v_offer.pool_id AND l.producer_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Usted no tiene lotes adheridos en este pool.';
    END IF;

    -- Comprobar si ya confirmó previamente
    IF EXISTS (
        SELECT 1 FROM public.offer_confirmations
        WHERE offer_id = p_offer_id AND producer_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Ya ha registrado su decisión para esta oferta.';
    END IF;

    -- Insertar confirmación
    INSERT INTO public.offer_confirmations (offer_id, producer_id, accepted)
    VALUES (p_offer_id, v_user_id, p_accepted);

    -- Registrar evento
    INSERT INTO public.commercial_events (pool_id, actor_id, event_type, details)
    VALUES (
        v_offer.pool_id,
        v_user_id,
        CASE WHEN p_accepted THEN 'offer_confirmed' ELSE 'offer_rejected' END,
        jsonb_build_object(
            'offer_id', p_offer_id,
            'producer_id', v_user_id,
            'accepted', p_accepted
        )
    );

    -- Si el productor rechazó, la oferta es rechazada inmediatamente y el pool regresa a objetivo_alcanzado
    IF NOT p_accepted THEN
        UPDATE public.offers
        SET status = 'rechazada'
        WHERE id = p_offer_id;

        UPDATE public.sales_pools
        SET status = 'objetivo_alcanzado'
        WHERE id = v_offer.pool_id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Ha rechazado la oferta comercial. El pool regresa a objetivo alcanzado.',
            'all_confirmed', false,
            'total_producers', 0,
            'confirmed_producers', 0
        );
    END IF;

    -- Contar productores distintos en el pool
    SELECT COUNT(DISTINCT l.producer_id) INTO v_total_producers
    FROM public.pool_members pm
    JOIN public.livestock_lots l ON l.id = pm.lot_id
    WHERE pm.pool_id = v_offer.pool_id;

    -- Contar confirmaciones positivas
    SELECT COUNT(DISTINCT oc.producer_id) INTO v_confirmed_producers
    FROM public.offer_confirmations oc
    WHERE oc.offer_id = p_offer_id AND oc.accepted = true;

    IF v_confirmed_producers >= v_total_producers AND v_total_producers > 0 THEN
        v_all_confirmed := true;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Confirmación registrada exitosamente.',
        'all_confirmed', v_all_confirmed,
        'total_producers', v_total_producers,
        'confirmed_producers', v_confirmed_producers
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: close_pool (Cierre comercial demostrativo por operador)
CREATE OR REPLACE FUNCTION public.rpc_close_pool(
    p_pool_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_role user_role;
    v_pool RECORD;
    v_offer RECORD;
    v_total_producers INTEGER := 0;
    v_confirmed_producers INTEGER := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
    IF v_role != 'operador' THEN
        RAISE EXCEPTION 'Solo un operador autorizado puede ejecutar el cierre comercial de un pool.';
    END IF;

    -- Bloqueo del pool
    SELECT * INTO v_pool FROM public.sales_pools
    WHERE id = p_pool_id
    FOR UPDATE;

    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'El pool especificado no existe.';
    END IF;

    IF v_pool.status != 'en_negociacion' THEN
        RAISE EXCEPTION 'El pool no se encuentra en estado de negociación (estado: %).', v_pool.status;
    END IF;

    -- Obtener oferta activa
    SELECT * INTO v_offer FROM public.offers
    WHERE pool_id = p_pool_id AND status = 'pendiente'
    FOR UPDATE;

    IF v_offer IS NULL THEN
        RAISE EXCEPTION 'No existe una oferta activa pendiente para este pool.';
    END IF;

    -- Verificar que todos los productores del pool hayan confirmado positivamente
    SELECT COUNT(DISTINCT l.producer_id) INTO v_total_producers
    FROM public.pool_members pm
    JOIN public.livestock_lots l ON l.id = pm.lot_id
    WHERE pm.pool_id = p_pool_id;

    SELECT COUNT(DISTINCT oc.producer_id) INTO v_confirmed_producers
    FROM public.offer_confirmations oc
    WHERE oc.offer_id = v_offer.id AND oc.accepted = true;

    IF v_confirmed_producers < v_total_producers OR v_total_producers = 0 THEN
        RAISE EXCEPTION 'No se puede cerrar el pool: faltan confirmaciones (% de % productores confirmaron).',
            v_confirmed_producers, v_total_producers;
    END IF;

    -- 1. Marcar oferta como aceptada
    UPDATE public.offers
    SET status = 'aceptada'
    WHERE id = v_offer.id;

    -- 2. Marcar pool como cerrado
    UPDATE public.sales_pools
    SET status = 'cerrado'
    WHERE id = p_pool_id;

    -- 3. Marcar lotes miembros como vendidos
    UPDATE public.livestock_lots
    SET status = 'vendido'
    WHERE id IN (
        SELECT lot_id FROM public.pool_members WHERE pool_id = p_pool_id
    );

    -- 4. Registrar evento final de cierre demostrativo
    INSERT INTO public.commercial_events (pool_id, actor_id, event_type, details)
    VALUES (
        p_pool_id,
        v_user_id,
        'pool_closed',
        jsonb_build_object(
            'operator_id', v_user_id,
            'offer_id', v_offer.id,
            'buyer_id', v_offer.buyer_id,
            'final_price_per_kg', v_offer.price_per_kg,
            'target_heads', v_pool.target_heads,
            'demo_note', 'Cierre demostrativo finalizado con éxito. En producción real requiere documentación y liquidación formal.'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Pool cerrado demostrativamente con éxito. Oferta aceptada y lotes marcados como vendidos.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
