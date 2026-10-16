-- ==============================================================================
-- YVYPASS — MIGRACIÓN 1: ESQUEMA BASE, TABLAS, ENUMS, RESTRICCIONES E ÍNDICES
-- Ideathon Corrientes 2026
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tipos Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('productor', 'comprador', 'operador');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE livestock_category AS ENUM (
        'ternero', 'ternera', 'novillo', 'vaquillona', 'vaca', 'toro'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('declarado', 'pendiente', 'revisado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lot_status AS ENUM ('disponible', 'reservado', 'vendido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pool_status AS ENUM (
        'abierto', 'objetivo_alcanzado', 'en_negociacion', 'cerrado', 'cancelado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE offer_status AS ENUM ('pendiente', 'aceptada', 'rechazada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabla: profiles (extensión de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'productor',
    phone TEXT,
    zone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabla: farms (establecimientos de productores)
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    province TEXT NOT NULL DEFAULT 'Corrientes',
    approximate_lat NUMERIC(9, 6),
    approximate_lng NUMERIC(9, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT farm_name_length CHECK (char_length(name) >= 2)
);

-- 5. Tabla: livestock_lots (lotes ganaderos)
CREATE TABLE IF NOT EXISTS public.livestock_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    category livestock_category NOT NULL,
    breed TEXT NOT NULL,
    head_count INTEGER NOT NULL,
    average_weight_kg NUMERIC(8, 2) NOT NULL,
    electronic_tag_reference TEXT,
    verification_status verification_status NOT NULL DEFAULT 'declarado',
    status lot_status NOT NULL DEFAULT 'disponible',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lot_head_count_positive CHECK (head_count > 0),
    CONSTRAINT lot_weight_positive CHECK (average_weight_kg > 0),
    CONSTRAINT lot_title_length CHECK (char_length(title) >= 3)
);

-- 6. Tabla: sales_pools (pools de venta conjunta)
CREATE TABLE IF NOT EXISTS public.sales_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    zone TEXT NOT NULL,
    category livestock_category NOT NULL,
    target_heads INTEGER NOT NULL,
    status pool_status NOT NULL DEFAULT 'abierto',
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pool_target_positive CHECK (target_heads > 0),
    CONSTRAINT pool_title_length CHECK (char_length(title) >= 3)
);

-- 7. Tabla: pool_members (adhesiones de lotes a pools)
CREATE TABLE IF NOT EXISTS public.pool_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES public.sales_pools(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES public.livestock_lots(id) ON DELETE RESTRICT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_pool_lot UNIQUE (pool_id, lot_id)
);

-- 8. Tabla: offers (ofertas indicativas de compradores)
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES public.sales_pools(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    price_per_kg NUMERIC(10, 2) NOT NULL,
    status offer_status NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT offer_price_positive CHECK (price_per_kg > 0)
);

-- Restricción para MVP: solo 1 oferta pendiente por pool activa
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_offer_per_pool
    ON public.offers (pool_id)
    WHERE status = 'pendiente';

-- 9. Tabla: offer_confirmations (confirmaciones individuales de productores)
CREATE TABLE IF NOT EXISTS public.offer_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    accepted BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_offer_producer_confirmation UNIQUE (offer_id, producer_id)
);

-- 10. Tabla: commercial_events (bitácora inmutable de eventos comerciales)
CREATE TABLE IF NOT EXISTS public.commercial_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES public.sales_pools(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    event_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_farms_owner ON public.farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_lots_producer ON public.livestock_lots(producer_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON public.livestock_lots(status);
CREATE INDEX IF NOT EXISTS idx_lots_category_status ON public.livestock_lots(category, status);
CREATE INDEX IF NOT EXISTS idx_pools_status ON public.sales_pools(status);
CREATE INDEX IF NOT EXISTS idx_pools_category_zone ON public.sales_pools(category, zone);
CREATE INDEX IF NOT EXISTS idx_pool_members_pool ON public.pool_members(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_members_lot ON public.pool_members(lot_id);
CREATE INDEX IF NOT EXISTS idx_offers_pool ON public.offers(pool_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_offer ON public.offer_confirmations(offer_id);
CREATE INDEX IF NOT EXISTS idx_events_pool ON public.commercial_events(pool_id, created_at ASC);

-- 12. Trigger para nuevos usuarios en auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, phone, zone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario YvyPass'),
        -- Por seguridad, todo registro automático es productor salvo asignación administrativa
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'productor'::user_role),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'zone'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
