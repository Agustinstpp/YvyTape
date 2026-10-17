-- ==============================================================================
-- YVYPASS — MIGRACIÓN 4: AUDITORÍA DE SEGURIDAD, RLS ESTRICTO, MENSAJERÍA
-- Y COMPATIBILIDAD GEOGRÁFICA CONTROLADA (P0 / P1)
-- Ideathon Corrientes 2026
-- ==============================================================================

-- 1. Función de compatibilidad geográfica entre zonas comerciales
CREATE OR REPLACE FUNCTION public.are_zones_compatible(p_zone_a TEXT, p_zone_b TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_za TEXT;
    v_zb TEXT;
BEGIN
    IF p_zone_a IS NULL OR p_zone_b IS NULL THEN
        RETURN FALSE;
    END IF;

    v_za := LOWER(TRIM(p_zone_a));
    v_zb := LOWER(TRIM(p_zone_b));

    IF v_za = v_zb THEN
        RETURN TRUE;
    END IF;

    -- Localidades ganaderas compatibles en radio controlado (~65-80 km):
    -- Curuzú Cuatiá <-> Mercedes (~68 km)
    IF (v_za = 'curuzu cuatia' AND v_zb = 'mercedes') OR (v_za = 'mercedes' AND v_zb = 'curuzu cuatia') THEN
        RETURN TRUE;
    END IF;
    -- Curuzú Cuatiá <-> Monte Caseros (~65 km)
    IF (v_za = 'curuzu cuatia' AND v_zb = 'monte caseros') OR (v_za = 'monte caseros' AND v_zb = 'curuzu cuatia') THEN
        RETURN TRUE;
    END IF;
    -- Mercedes <-> Corrientes Centro (~45 km)
    IF (v_za = 'mercedes' AND v_zb = 'corrientes centro') OR (v_za = 'corrientes centro' AND v_zb = 'mercedes') THEN
        RETURN TRUE;
    END IF;
    -- Goya <-> Bella Vista (~74 km)
    IF (v_za = 'goya' AND v_zb = 'bella vista') OR (v_za = 'bella vista' AND v_zb = 'goya') THEN
        RETURN TRUE;
    END IF;
    -- Santo Tomé <-> Gobernador Virasoro / Virasoro (~56 km)
    IF (v_za = 'santo tome' AND v_zb IN ('virasoro', 'gobernador virasoro')) OR (v_za IN ('virasoro', 'gobernador virasoro') AND v_zb = 'santo tome') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Tarea 1.1 — Corregir asignación de roles y evitar escalada de privilegios a operador
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_requested_role TEXT;
    v_safe_role user_role;
BEGIN
    v_requested_role := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', 'productor')));

    -- Restricción estricta de seguridad: En el registro público solo se permite 'productor' o 'comprador'.
    -- Si la petición intenta solicitar 'operador' o cualquier valor no autorizado, se degrada a 'productor'.
    IF v_requested_role = 'comprador' THEN
        v_safe_role := 'comprador'::user_role;
    ELSE
        v_safe_role := 'productor'::user_role;
    END IF;

    INSERT INTO public.profiles (id, full_name, role, phone, zone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario YvyPass'),
        v_safe_role,
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'zone'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        zone = COALESCE(EXCLUDED.zone, public.profiles.zone);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Tarea 1.2 — Corregir políticas RLS para impedir elusión de reglas comerciales por inserción directa
-- Revocar políticas de inserción directa abierta
DROP POLICY IF EXISTS "pool_members_insert_policy" ON public.pool_members;
DROP POLICY IF EXISTS "pool_members_delete_policy" ON public.pool_members;
DROP POLICY IF EXISTS "offers_insert_policy" ON public.offers;
DROP POLICY IF EXISTS "confirmations_insert_policy" ON public.offer_confirmations;

-- Asegurar que livestock_lots no permita modificación directa de estados protegidos
DROP POLICY IF EXISTS "lots_update_policy" ON public.livestock_lots;
CREATE POLICY "lots_update_policy"
    ON public.livestock_lots FOR UPDATE
    TO authenticated
    USING (
        producer_id = auth.uid() AND
        status = 'disponible'
    )
    WITH CHECK (
        producer_id = auth.uid() AND
        status = 'disponible'
    );

-- 4. Tarea 1.3 — Consistencia transaccional y RPCs seguras (con search_path explícito)

-- 4.1 RPC: rpc_join_pool
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
    -- Autenticación
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    -- Rol
    SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
    IF v_role != 'productor' THEN
        RAISE EXCEPTION 'Solo los productores pueden adherir lotes a un pool.';
    END IF;

    -- Bloqueo y verificación del lote
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

    -- Bloqueo y verificación del pool
    SELECT * INTO v_pool FROM public.sales_pools
    WHERE id = p_pool_id
    FOR UPDATE;

    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'El pool de venta especificado no existe.';
    END IF;

    IF v_pool.status != 'abierto' THEN
        RAISE EXCEPTION 'El pool no está abierto para recibir adhesiones (estado actual: %).', v_pool.status;
    END IF;

    -- Compatibilidad de Categoría
    IF v_lot.category != v_pool.category THEN
        RAISE EXCEPTION 'Categoría incompatible: el pool requiere % pero el lote es %.',
            v_pool.category, v_lot.category;
    END IF;

    -- Compatibilidad de Zona (Misma zona o zona cercana compatible)
    SELECT zone INTO v_farm_zone FROM public.farms WHERE id = v_lot.farm_id;
    IF NOT public.are_zones_compatible(v_farm_zone, v_pool.zone) THEN
        RAISE EXCEPTION 'Zona incompatible: el pool es de zona "%" y el establecimiento es de zona "%".',
            v_pool.zone, COALESCE(v_farm_zone, 'Desconocida');
    END IF;

    -- Comprobar que no esté ya en un pool activo
    IF EXISTS (
        SELECT 1 FROM public.pool_members pm
        JOIN public.sales_pools sp ON sp.id = pm.pool_id
        WHERE pm.lot_id = p_lot_id AND sp.status IN ('abierto', 'objetivo_alcanzado', 'en_negociacion')
    ) THEN
        RAISE EXCEPTION 'El lote ya se encuentra adherido a un pool activo.';
    END IF;

    -- Calcular cabezas actuales del pool de forma atómica
    SELECT COALESCE(SUM(l.head_count), 0) INTO v_current_heads
    FROM public.pool_members pm
    JOIN public.livestock_lots l ON l.id = pm.lot_id
    WHERE pm.pool_id = p_pool_id;

    v_new_total := v_current_heads + v_lot.head_count;

    IF v_new_total > v_pool.target_heads THEN
        RAISE EXCEPTION 'La adhesión de % cabezas superaría el objetivo del pool (% de % cabezas).',
            v_lot.head_count, v_new_total, v_pool.target_heads;
    END IF;

    -- Insertar adhesión
    INSERT INTO public.pool_members (pool_id, lot_id)
    VALUES (p_pool_id, p_lot_id);

    -- Reservar el lote
    UPDATE public.livestock_lots
    SET status = 'reservado'
    WHERE id = p_lot_id;

    -- Determinar nuevo estado del pool
    v_new_pool_status := v_pool.status;
    IF v_new_total = v_pool.target_heads THEN
        v_new_pool_status := 'objetivo_alcanzado';
        UPDATE public.sales_pools
        SET status = 'objetivo_alcanzado'
        WHERE id = p_pool_id;

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

    -- Evento de adhesión
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4.2 RPC: rpc_leave_pool
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4.3 RPC: rpc_create_offer
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4.4 RPC: rpc_confirm_offer
CREATE OR REPLACE FUNCTION public.rpc_confirm_offer(
    p_offer_id UUID,
    p_accepted BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_role user_role;
    v_offer RECORD;
    v_pool RECORD;
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

    -- Bloqueo de pool
    SELECT * INTO v_pool FROM public.sales_pools
    WHERE id = v_offer.pool_id
    FOR UPDATE;

    IF v_pool IS NULL OR v_pool.status != 'en_negociacion' THEN
        RAISE EXCEPTION 'El pool no se encuentra en estado de negociación.';
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4.5 RPC: rpc_close_pool
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

    -- 4. Registrar evento final de cierre
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
            'target_heads', v_pool.target_heads
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Pool cerrado demostrativamente con éxito. Oferta aceptada y lotes marcados como vendidos.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. FASE 2 — TABLAS DE MENSAJERÍA REAL PERSISTENTE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    context TEXT NOT NULL,
    pool_id UUID REFERENCES public.sales_pools(id) ON DELETE SET NULL,
    lot_id UUID REFERENCES public.livestock_lots(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT conversation_subject_not_empty CHECK (char_length(trim(subject)) > 0)
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT message_body_length CHECK (char_length(trim(body)) > 0 AND char_length(body) <= 1000)
);

-- Índices de mensajería
CREATE INDEX IF NOT EXISTS idx_conversations_pool ON public.conversations(pool_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- RLS de mensajería
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas conversations
CREATE POLICY "conversations_select_policy"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid() OR
        public.get_current_user_role() = 'operador' OR
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "conversations_insert_policy"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- Políticas conversation_participants
CREATE POLICY "participants_select_policy"
    ON public.conversation_participants FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        public.get_current_user_role() = 'operador' OR
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "participants_insert_policy"
    ON public.conversation_participants FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR
        public.get_current_user_role() = 'operador' OR
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND (c.created_by = auth.uid() OR public.get_current_user_role() = 'operador')
        )
    );

CREATE POLICY "participants_update_policy"
    ON public.conversation_participants FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Políticas messages
CREATE POLICY "messages_select_policy"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'operador' OR
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "messages_insert_policy"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        (
            public.get_current_user_role() = 'operador' OR
            EXISTS (
                SELECT 1 FROM public.conversation_participants cp
                WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
            )
        )
    );

-- Permisos de ejecución explícitos en funciones
REVOKE ALL ON FUNCTION public.rpc_join_pool(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_join_pool(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_leave_pool(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_leave_pool(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_create_offer(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_create_offer(UUID, NUMERIC) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_confirm_offer(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_confirm_offer(UUID, BOOLEAN) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_close_pool(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_close_pool(UUID) TO authenticated;
