-- ==============================================================================
-- YVYPASS — MIGRACIÓN 5: CORRECCIÓN DE POLÍTICAS RLS PARA VENTAS CONJUNTAS,
-- VISIBILIDAD DE OFERTAS ENTRE PRODUCTORES Y NORMALIZACIÓN DE TILDES EN ZONAS
-- Ideathon Corrientes 2026
-- ==============================================================================

-- 1. Permitir que los miembros de la venta conjunta y visitantes vean los lotes
-- (resuelve que los productores solo veían sus propias cabezas en 0 de 400)
DROP POLICY IF EXISTS "lots_select_policy" ON public.livestock_lots;
CREATE POLICY "lots_select_policy" ON public.livestock_lots FOR SELECT 
TO authenticated, anon
USING (
  status IN ('disponible', 'reservado', 'vendido')
  OR producer_id = auth.uid()
  OR public.get_current_user_role() IN ('comprador', 'operador')
);

-- 2. Permitir que los productores de un mismo pool vean las respuestas y confirmaciones a ofertas
-- (resuelve que un productor no veía si sus compañeros habían aceptado la oferta)
DROP POLICY IF EXISTS "confirmations_select_policy" ON public.offer_confirmations;
CREATE POLICY "confirmations_select_policy" ON public.offer_confirmations FOR SELECT
TO authenticated
USING (
    producer_id = auth.uid()
    OR public.get_current_user_role() = 'operador'
    OR EXISTS (
        SELECT 1 FROM public.offers o
        WHERE o.id = offer_confirmations.offer_id AND o.buyer_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.offers o
        JOIN public.pool_members pm ON pm.pool_id = o.pool_id
        JOIN public.livestock_lots l ON l.id = pm.lot_id
        WHERE o.id = offer_confirmations.offer_id AND l.producer_id = auth.uid()
    )
);

-- 3. Corregir compatibilidad geográfica tolerante a tildes (Curuzú Cuatiá / Mercedes / Santo Tomé)
-- (resuelve el error de excepción al intentar adherir lotes de localidades compatibles con tilde)
CREATE OR REPLACE FUNCTION public.are_zones_compatible(p_zone_a TEXT, p_zone_b TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_za TEXT;
    v_zb TEXT;
BEGIN
    IF p_zone_a IS NULL OR p_zone_b IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Normalizar a minúsculas y sin acentos
    v_za := translate(LOWER(TRIM(p_zone_a)), 'áéíóúÁÉÍÓÚ', 'aeiouaeiou');
    v_zb := translate(LOWER(TRIM(p_zone_b)), 'áéíóúÁÉÍÓÚ', 'aeiouaeiou');

    IF v_za = v_zb THEN
        RETURN TRUE;
    END IF;

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
