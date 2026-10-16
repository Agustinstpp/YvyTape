-- ==============================================================================
-- YVYPASS — MIGRACIÓN 2: ROW LEVEL SECURITY (RLS) Y POLÍTICAS POR ROL
-- Ideathon Corrientes 2026
-- ==============================================================================

-- 1. Función de rol seguro de usuario
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Trigger para impedir que los usuarios editen su propio rol desde el frontend
CREATE OR REPLACE FUNCTION public.prevent_role_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Si no es el service_role, no permitir cambiar la columna role ni id
    IF (auth.jwt() ->> 'role') IS DISTINCT FROM 'service_role' THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'No está autorizado a modificar su rol de usuario.';
        END IF;
        IF NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'No está autorizado a modificar su identificador.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_modification ON public.profiles;
CREATE TRIGGER trg_prevent_role_modification
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_modification();

-- 3. Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_events ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS: profiles
-- Lectura: Cualquier usuario autenticado puede consultar perfiles básicos
CREATE POLICY "profiles_select_policy"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Modificación: Solo el propio usuario puede actualizar sus datos de contacto
CREATE POLICY "profiles_update_policy"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Inserción: Gestionada por trigger de auth o service_role
CREATE POLICY "profiles_insert_policy"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- 5. POLÍTICAS: farms
-- Lectura: Visible para usuarios autenticados
CREATE POLICY "farms_select_policy"
    ON public.farms FOR SELECT
    TO authenticated
    USING (true);

-- Inserción: Solo productores para sus propios establecimientos
CREATE POLICY "farms_insert_policy"
    ON public.farms FOR INSERT
    TO authenticated
    WITH CHECK (
        owner_id = auth.uid() AND
        public.get_current_user_role() = 'productor'
    );

-- Actualización: Solo el dueño
CREATE POLICY "farms_update_policy"
    ON public.farms FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Eliminación: Solo el dueño
CREATE POLICY "farms_delete_policy"
    ON public.farms FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- 6. POLÍTICAS: livestock_lots
-- Lectura: Lotes disponibles son visibles a todos los autenticados; lotes propios siempre visibles
CREATE POLICY "lots_select_policy"
    ON public.livestock_lots FOR SELECT
    TO authenticated, anon
    USING (
        status = 'disponible' OR
        producer_id = auth.uid() OR
        public.get_current_user_role() IN ('comprador', 'operador')
    );

-- Inserción: Solo el productor propietario y con farm verificada de su propiedad
CREATE POLICY "lots_insert_policy"
    ON public.livestock_lots FOR INSERT
    TO authenticated
    WITH CHECK (
        producer_id = auth.uid() AND
        public.get_current_user_role() = 'productor' AND
        status = 'disponible' AND
        verification_status = 'declarado' AND
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE farms.id = farm_id AND farms.owner_id = auth.uid()
        )
    );

-- Actualización: Solo el productor si el lote está disponible
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

-- 7. POLÍTICAS: sales_pools
-- Lectura: Visible para todos (anónimos y autenticados para explorar catálogo)
CREATE POLICY "pools_select_policy"
    ON public.sales_pools FOR SELECT
    TO authenticated, anon
    USING (true);

-- Inserción: Operadores o productores autorizados
CREATE POLICY "pools_insert_policy"
    ON public.sales_pools FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.uid() AND
        public.get_current_user_role() IN ('operador', 'productor')
    );

-- Actualización: Solo operadores (las transacciones de estado se realizan por RPC)
CREATE POLICY "pools_update_policy"
    ON public.sales_pools FOR UPDATE
    TO authenticated
    USING (public.get_current_user_role() = 'operador')
    WITH CHECK (public.get_current_user_role() = 'operador');

-- 8. POLÍTICAS: pool_members
-- Lectura: Visible a usuarios autenticados
CREATE POLICY "pool_members_select_policy"
    ON public.pool_members FOR SELECT
    TO authenticated, anon
    USING (true);

-- Inserción: A través de funciones seguras o por el dueño del lote
CREATE POLICY "pool_members_insert_policy"
    ON public.pool_members FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.livestock_lots l
            WHERE l.id = lot_id AND l.producer_id = auth.uid()
        )
    );

-- Eliminación: Solo el dueño del lote
CREATE POLICY "pool_members_delete_policy"
    ON public.pool_members FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.livestock_lots l
            WHERE l.id = lot_id AND l.producer_id = auth.uid()
        )
    );

-- 9. POLÍTICAS: offers
-- Lectura: Visible si es el comprador emisor, miembro del pool o el operador
CREATE POLICY "offers_select_policy"
    ON public.offers FOR SELECT
    TO authenticated
    USING (
        buyer_id = auth.uid() OR
        public.get_current_user_role() = 'operador' OR
        EXISTS (
            SELECT 1 FROM public.pool_members pm
            JOIN public.livestock_lots l ON l.id = pm.lot_id
            WHERE pm.pool_id = offers.pool_id AND l.producer_id = auth.uid()
        )
    );

-- Inserción: Solo compradores autenticados
CREATE POLICY "offers_insert_policy"
    ON public.offers FOR INSERT
    TO authenticated
    WITH CHECK (
        buyer_id = auth.uid() AND
        public.get_current_user_role() = 'comprador'
    );

-- 10. POLÍTICAS: offer_confirmations
-- Lectura: Visible para miembros del pool, comprador y operador
CREATE POLICY "confirmations_select_policy"
    ON public.offer_confirmations FOR SELECT
    TO authenticated
    USING (
        producer_id = auth.uid() OR
        public.get_current_user_role() = 'operador' OR
        EXISTS (
            SELECT 1 FROM public.offers o
            WHERE o.id = offer_confirmations.offer_id AND o.buyer_id = auth.uid()
        )
    );

-- Inserción: Solo el productor en su propio nombre
CREATE POLICY "confirmations_insert_policy"
    ON public.offer_confirmations FOR INSERT
    TO authenticated
    WITH CHECK (
        producer_id = auth.uid() AND
        public.get_current_user_role() = 'productor'
    );

-- 11. POLÍTICAS: commercial_events
-- Lectura: Transparente y auditable para todos los autenticados
CREATE POLICY "events_select_policy"
    ON public.commercial_events FOR SELECT
    TO authenticated, anon
    USING (true);

-- Inserción: Solo vía backend/RPC autenticado con actor coincidente
CREATE POLICY "events_insert_policy"
    ON public.commercial_events FOR INSERT
    TO authenticated
    WITH CHECK (actor_id = auth.uid());
