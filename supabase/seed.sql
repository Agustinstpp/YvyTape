-- ==============================================================================
-- YVYPASS — SEED DEMOSTRATIVO (IDEATHON CORRIENTES 2026)
-- Escenario Base de Venta Conjunta: 350/400 Novillos Curuzú Cuatiá
-- Totalmente atómico, idempotente y compatible con Supabase Auth / Studio / CLI
-- ==============================================================================

-- 0. Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

-- 1. Limpieza de colisiones de correo previo (si existieran cuentas con otro UUID)
DELETE FROM auth.users
WHERE email IN (
    'productor.a@yvypass.com.ar',
    'productor.b@yvypass.com.ar',
    'productor.c@yvypass.com.ar',
    'productor.d@yvypass.com.ar',
    'productor.e@yvypass.com.ar',
    'comprador.litoral@yvypass.com.ar',
    'comprador.sa@yvypass.com.ar',
    'operador@yvypass.com.ar'
)
AND id NOT IN (
    '11111111-1111-4000-8000-000000000001',
    '11111111-1111-4000-8000-000000000002',
    '11111111-1111-4000-8000-000000000003',
    '11111111-1111-4000-8000-000000000004',
    '11111111-1111-4000-8000-000000000005',
    '22222222-2222-4000-8000-000000000001',
    '22222222-2222-4000-8000-000000000002',
    '33333333-3333-4000-8000-000000000001'
);

-- 2. Inserción / Actualización idempotente en auth.users con esquema GoTrue completo
DO $$
DECLARE
    v_pwd_hash TEXT := crypt('YvyPass2026!', gen_salt('bf'));
BEGIN
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role,
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
    )
    VALUES
        -- Productores (5)
        ('11111111-1111-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'productor.a@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"],"role":"productor"}'::jsonb, '{"full_name":"Don Juan Romero (DEMO)","role":"productor","zone":"Curuzú Cuatiá","phone":"+543774111001"}'::jsonb, 'authenticated', 'authenticated', false, now(), now(), '', '', '', ''),
        ('11111111-1111-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'productor.b@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"],"role":"productor"}'::jsonb, '{"full_name":"Doña Carmen Silva (DEMO)","role":"productor","zone":"Curuzú Cuatiá","phone":"+543774111002"}'::jsonb, 'authenticated', 'authenticated', false, now(), now(), '', '', '', ''),
        ('11111111-1111-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'productor.c@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"],"role":"productor"}'::jsonb, '{"full_name":"Cabaña Las Lilas NEA (DEMO)","role":"productor","zone":"Curuzú Cuatiá","phone":"+543774111003"}'::jsonb, 'authenticated', 'authenticated', false, now(), now(), '', '', '', ''),
        ('11111111-1111-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'productor.d@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"],"role":"productor"}'::jsonb, '{"full_name":"Don Pedro Morales (DEMO)","role":"productor","zone":"Curuzú Cuatiá","phone":"+543774111004"}'::jsonb, 'authenticated', 'authenticated', false, now(), now(), '', '', '', ''),
        ('11111111-1111-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'productor.e@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"],"role":"productor"}'::jsonb, '{"full_name":"Estancia Iberá (DEMO)","role":"productor","zone":"Santo Tomé","phone":"+543774111005"}'::jsonb, 'authenticated', 'authenticated', false, now(), now(), '', '', '', ''),

        -- Compradores (2)
        ('22222222-2222-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'comprador.litoral@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"],"role":"comprador"}'::jsonb, '{"full_name":"Frigorífico del Litoral (DEMO)","role":"comprador","zone":"Corrientes Capital","phone":"+543794222001"}'::jsonb, 'authenticated', 'authenticated', false, now(), now(), '', '', '', ''),
        ('22222222-2222-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'comprador.sa@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"],"role":"comprador"}'::jsonb, '{"full_name":"Carnes Correntinas SA (DEMO)","role":"comprador","zone":"Goya","phone":"+543794222002"}'::jsonb, 'authenticated', 'authenticated', false, now(), now(), '', '', '', ''),

        -- Operador (1)
        ('33333333-3333-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'operador@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"],"role":"operador"}'::jsonb, '{"full_name":"Operador Consignatario NEA (DEMO)","role":"operador","zone":"Corrientes","phone":"+543794333001"}'::jsonb, 'authenticated', 'authenticated', false, now(), now(), '', '', '', '')
    ON CONFLICT (id) DO UPDATE SET
        instance_id = EXCLUDED.instance_id,
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        raw_app_meta_data = EXCLUDED.raw_app_meta_data,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        aud = EXCLUDED.aud,
        role = EXCLUDED.role,
        updated_at = now();
END $$;

-- 3. Profiles (Sincronización segura de roles y datos públicos)
-- Se desactiva temporalmente el trigger anti-escalada durante el seed administrativo
ALTER TABLE public.profiles DISABLE TRIGGER trg_prevent_role_modification;

INSERT INTO public.profiles (id, full_name, role, zone, phone)
VALUES
    ('11111111-1111-4000-8000-000000000001', 'Don Juan Romero (DEMO)', 'productor', 'Curuzú Cuatiá', '+543774111001'),
    ('11111111-1111-4000-8000-000000000002', 'Doña Carmen Silva (DEMO)', 'productor', 'Curuzú Cuatiá', '+543774111002'),
    ('11111111-1111-4000-8000-000000000003', 'Cabaña Las Lilas NEA (DEMO)', 'productor', 'Curuzú Cuatiá', '+543774111003'),
    ('11111111-1111-4000-8000-000000000004', 'Don Pedro Morales (DEMO)', 'productor', 'Curuzú Cuatiá', '+543774111004'),
    ('11111111-1111-4000-8000-000000000005', 'Estancia Iberá (DEMO)', 'productor', 'Santo Tomé', '+543774111005'),
    ('22222222-2222-4000-8000-000000000001', 'Frigorífico del Litoral (DEMO)', 'comprador', 'Corrientes Capital', '+543794222001'),
    ('22222222-2222-4000-8000-000000000002', 'Carnes Correntinas SA (DEMO)', 'comprador', 'Goya', '+543794222002'),
    ('33333333-3333-4000-8000-000000000001', 'Operador Consignatario NEA (DEMO)', 'operador', 'Corrientes', '+543794333001')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    zone = EXCLUDED.zone,
    phone = EXCLUDED.phone;

ALTER TABLE public.profiles ENABLE TRIGGER trg_prevent_role_modification;

-- 4. Establecimientos (Farms en Corrientes con coordenadas públicas aproximadas)
INSERT INTO public.farms (id, owner_id, name, zone, province, approximate_lat, approximate_lng)
VALUES
    ('44444444-4444-4000-8000-000000000001', '11111111-1111-4000-8000-000000000001', 'La Querencia (DEMO)', 'Curuzú Cuatiá', 'Corrientes', -29.7891, -58.0543),
    ('44444444-4444-4000-8000-000000000002', '11111111-1111-4000-8000-000000000002', 'El Ombú (DEMO)', 'Curuzú Cuatiá', 'Corrientes', -29.7541, -58.0122),
    ('44444444-4444-4000-8000-000000000003', '11111111-1111-4000-8000-000000000003', 'Rincón del Yvy (DEMO)', 'Curuzú Cuatiá', 'Corrientes', -29.8120, -58.0934),
    ('44444444-4444-4000-8000-000000000004', '11111111-1111-4000-8000-000000000004', 'Los Cardales (DEMO)', 'Curuzú Cuatiá', 'Corrientes', -29.7712, -58.0311),
    ('44444444-4444-4000-8000-000000000005', '11111111-1111-4000-8000-000000000005', 'Pastizales del Iberá (DEMO)', 'Santo Tomé', 'Corrientes', -28.5489, -56.0421),
    -- Farm 6: Productor B en Mercedes (localidad vecina compatible a ~68 km)
    ('44444444-4444-4000-8000-000000000006', '11111111-1111-4000-8000-000000000002', 'Estancia El Payubreró (DEMO)', 'Mercedes', 'Corrientes', -29.1842, -58.0752)
ON CONFLICT (id) DO UPDATE SET
    owner_id = EXCLUDED.owner_id,
    name = EXCLUDED.name,
    zone = EXCLUDED.zone,
    province = EXCLUDED.province,
    approximate_lat = EXCLUDED.approximate_lat,
    approximate_lng = EXCLUDED.approximate_lng;

-- 5. Pools de Venta Conjunta
-- Pool 1: 400 Novillos Curuzú Cuatiá (Inicial 350 cabezas para permitir adhesión interactiva en la demo)
-- Pool 2: 200 Vaquillonas Santo Tomé (Inicial 110 cabezas)
INSERT INTO public.sales_pools (id, title, zone, category, target_heads, status, created_by)
VALUES
    ('66666666-6666-4000-8000-000000000001', 'Pool Novillos Curuzú Cuatiá 400 (DEMO)', 'Curuzú Cuatiá', 'novillo', 400, 'abierto', '33333333-3333-4000-8000-000000000001'),
    ('66666666-6666-4000-8000-000000000002', 'Pool Vaquillonas NEA Norte 200 (DEMO)', 'Santo Tomé', 'vaquillona', 200, 'abierto', '33333333-3333-4000-8000-000000000001')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    zone = EXCLUDED.zone,
    category = EXCLUDED.category,
    target_heads = EXCLUDED.target_heads,
    status = EXCLUDED.status,
    created_by = EXCLUDED.created_by;

-- 6. Lotes Ganaderos (9 Lotes Demostrativos)
INSERT INTO public.livestock_lots (id, producer_id, farm_id, title, category, breed, head_count, average_weight_kg, electronic_tag_reference, verification_status, status)
VALUES
    -- Lote 1: Productor A (120 novillos) -> Adherido a Pool 1 (reservado)
    ('55555555-5555-4000-8000-000000000001', '11111111-1111-4000-8000-000000000001', '44444444-4444-4000-8000-000000000001', '120 Novillos Braford Marca Líquida (DEMO)', 'novillo', 'Braford', 120, 385.00, 'TAG-CC-001', 'declarado', 'reservado'),
    -- Lote 2: Productor B (80 novillos) -> Adherido a Pool 1 (reservado)
    ('55555555-5555-4000-8000-000000000002', '11111111-1111-4000-8000-000000000002', '44444444-4444-4000-8000-000000000002', '80 Novillos Brangus Colorados (DEMO)', 'novillo', 'Brangus', 80, 390.00, 'TAG-CC-002', 'declarado', 'reservado'),
    -- Lote 3: Productor C (150 novillos) -> Adherido a Pool 1 (reservado)
    -- Total inicial Pool 1 = 120 + 80 + 150 = 350 novillos!
    ('55555555-5555-4000-8000-000000000003', '11111111-1111-4000-8000-000000000003', '44444444-4444-4000-8000-000000000003', '150 Novillos Braford Pesados (DEMO)', 'novillo', 'Braford', 150, 410.00, 'TAG-CC-003', 'declarado', 'reservado'),
    -- Lote 4: Productor D (50 novillos) -> ¡DISPONIBLE PARA COMPLETAR EL POOL EN VIVO DE 350 A 400!
    ('55555555-5555-4000-8000-000000000004', '11111111-1111-4000-8000-000000000004', '44444444-4444-4000-8000-000000000004', '50 Novillos Braford Seleccionados (DEMO)', 'novillo', 'Braford', 50, 395.00, 'TAG-CC-004', 'declarado', 'disponible'),
    -- Lote 5: Productor D (70 terneros) -> disponible
    ('55555555-5555-4000-8000-000000000005', '11111111-1111-4000-8000-000000000004', '44444444-4444-4000-8000-000000000004', '70 Terneros Braford Destete (DEMO)', 'ternero', 'Braford', 70, 180.00, 'TAG-CC-005', 'declarado', 'disponible'),
    -- Lote 6: Productor E (110 vaquillonas) -> Adherido a Pool 2 (reservado)
    ('55555555-5555-4000-8000-000000000006', '11111111-1111-4000-8000-000000000005', '44444444-4444-4000-8000-000000000005', '110 Vaquillonas Brangus para Entore (DEMO)', 'vaquillona', 'Brangus', 110, 290.00, 'TAG-ST-001', 'declarado', 'reservado'),
    -- Lote 7: Productor E (90 vaquillonas) -> disponible
    ('55555555-5555-4000-8000-000000000007', '11111111-1111-4000-8000-000000000005', '44444444-4444-4000-8000-000000000005', '90 Vaquillonas Braford (DEMO)', 'vaquillona', 'Braford', 90, 285.00, 'TAG-ST-002', 'declarado', 'disponible'),
    -- Lote 8: Productor B (60 terneras) -> disponible
    ('55555555-5555-4000-8000-000000000008', '11111111-1111-4000-8000-000000000002', '44444444-4444-4000-8000-000000000002', '60 Terneras Brangus Puras (DEMO)', 'ternera', 'Brangus', 60, 175.00, 'TAG-CC-006', 'declarado', 'disponible'),
    -- Lote 9: Productor B (50 novillos en Mercedes) -> ¡DISPONIBLE EN LOCALIDAD VECINA COMPATIBLE PARA COMPLETAR LA VENTA / INVITAR!
    ('55555555-5555-4000-8000-000000000009', '11111111-1111-4000-8000-000000000002', '44444444-4444-4000-8000-000000000006', '50 Novillos Braford Mercedes (DEMO)', 'novillo', 'Braford', 50, 390.00, 'TAG-ME-001', 'declarado', 'disponible')
ON CONFLICT (id) DO UPDATE SET
    producer_id = EXCLUDED.producer_id,
    farm_id = EXCLUDED.farm_id,
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    breed = EXCLUDED.breed,
    head_count = EXCLUDED.head_count,
    average_weight_kg = EXCLUDED.average_weight_kg,
    electronic_tag_reference = EXCLUDED.electronic_tag_reference,
    verification_status = EXCLUDED.verification_status,
    status = EXCLUDED.status;

-- 7. Adhesiones de Miembros al Pool (Idempotente y no destructivo)
-- Si el Lote 4 o 9 fueron adheridos durante una prueba previa del guion demo, se retiran de forma acotada
DELETE FROM public.pool_members
WHERE pool_id = '66666666-6666-4000-8000-000000000001'
  AND lot_id IN ('55555555-5555-4000-8000-000000000004', '55555555-5555-4000-8000-000000000009');

-- Limpiar ofertas transitorias generadas en pruebas previas de Pool 1 y 2 para reiniciar la demo limpia
DELETE FROM public.offers
WHERE pool_id IN (
    '66666666-6666-4000-8000-000000000001',
    '66666666-6666-4000-8000-000000000002'
);

-- Insertar membresías fijas con IDs deterministas y ON CONFLICT
INSERT INTO public.pool_members (id, pool_id, lot_id, joined_at)
VALUES
    ('77777777-7777-4000-8000-000000000001', '66666666-6666-4000-8000-000000000001', '55555555-5555-4000-8000-000000000001', now() - interval '3 hours'),
    ('77777777-7777-4000-8000-000000000002', '66666666-6666-4000-8000-000000000001', '55555555-5555-4000-8000-000000000002', now() - interval '2 hours'),
    ('77777777-7777-4000-8000-000000000003', '66666666-6666-4000-8000-000000000001', '55555555-5555-4000-8000-000000000003', now() - interval '1 hour'),
    ('77777777-7777-4000-8000-000000000004', '66666666-6666-4000-8000-000000000002', '55555555-5555-4000-8000-000000000006', now() - interval '4 hours')
ON CONFLICT (pool_id, lot_id) DO UPDATE SET
    joined_at = EXCLUDED.joined_at;

-- 8. Bitácora de Eventos Comerciales
-- Retirar únicamente eventos de pruebas posteriores a los 4 eventos iniciales del pool demo
DELETE FROM public.commercial_events
WHERE pool_id = '66666666-6666-4000-8000-000000000001'
  AND id NOT IN (
    '88888888-8888-4000-8000-000000000001',
    '88888888-8888-4000-8000-000000000002',
    '88888888-8888-4000-8000-000000000003',
    '88888888-8888-4000-8000-000000000004'
  );

INSERT INTO public.commercial_events (id, pool_id, actor_id, event_type, details, created_at)
VALUES
    ('88888888-8888-4000-8000-000000000001', '66666666-6666-4000-8000-000000000001', '33333333-3333-4000-8000-000000000001', 'pool_created', '{"title":"Pool Novillos Curuzú Cuatiá 400 (DEMO)","target_heads":400,"category":"novillo","zone":"Curuzú Cuatiá"}'::jsonb, now() - interval '4 hours'),
    ('88888888-8888-4000-8000-000000000002', '66666666-6666-4000-8000-000000000001', '11111111-1111-4000-8000-000000000001', 'lot_joined', '{"producer":"Don Juan Romero","head_count":120,"total_heads_now":120}'::jsonb, now() - interval '3 hours'),
    ('88888888-8888-4000-8000-000000000003', '66666666-6666-4000-8000-000000000001', '11111111-1111-4000-8000-000000000002', 'lot_joined', '{"producer":"Doña Carmen Silva","head_count":80,"total_heads_now":200}'::jsonb, now() - interval '2 hours'),
    ('88888888-8888-4000-8000-000000000004', '66666666-6666-4000-8000-000000000001', '11111111-1111-4000-8000-000000000003', 'lot_joined', '{"producer":"Cabaña Las Lilas NEA","head_count":150,"total_heads_now":350}'::jsonb, now() - interval '1 hour')
ON CONFLICT (id) DO UPDATE SET
    event_type = EXCLUDED.event_type,
    details = EXCLUDED.details,
    created_at = EXCLUDED.created_at;

COMMIT;
