-- ==============================================================================
-- YVYPASS — SEED DEMOSTRATIVO (IDEATHON CORRIENTES 2026)
-- Escenario Base de Venta Conjunta: 350/400 Novillos
-- ==============================================================================

-- 1. Usuarios en auth.users (ID fijo para entorno local / demo reproducible)
-- En producción o Supabase Cloud, estos usuarios se generan con create-demo-users.ts
DO $$
DECLARE
    v_pwd_hash TEXT := crypt('YvyPass2026!', gen_salt('bf'));
BEGIN
    -- Productores (5)
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES
        ('11111111-1111-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'productor.a@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Don Juan Romero (DEMO)","role":"productor","zone":"Curuzú Cuatiá","phone":"+543774111001"}', now(), now()),
        ('11111111-1111-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'productor.b@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Doña Carmen Silva (DEMO)","role":"productor","zone":"Curuzú Cuatiá","phone":"+543774111002"}', now(), now()),
        ('11111111-1111-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'productor.c@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Cabaña Las Lilas NEA (DEMO)","role":"productor","zone":"Curuzú Cuatiá","phone":"+543774111003"}', now(), now()),
        ('11111111-1111-4000-8000-000000000004', '00000000-0000-0000-0000-000000000004', 'productor.d@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Don Pedro Morales (DEMO)","role":"productor","zone":"Curuzú Cuatiá","phone":"+543774111004"}', now(), now()),
        ('11111111-1111-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'productor.e@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Estancia Iberá (DEMO)","role":"productor","zone":"Santo Tomé","phone":"+543774111005"}', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- Compradores (2)
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES
        ('22222222-2222-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'comprador.litoral@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Frigorífico del Litoral (DEMO)","role":"comprador","zone":"Corrientes Capital","phone":"+543794222001"}', now(), now()),
        ('22222222-2222-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'comprador.sa@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carnes Correntinas SA (DEMO)","role":"comprador","zone":"Goya","phone":"+543794222002"}', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- Operador (1)
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES
        ('33333333-3333-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'operador@yvypass.com.ar', v_pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Operador Consignatario NEA (DEMO)","role":"operador","zone":"Corrientes","phone":"+543794333001"}', now(), now())
    ON CONFLICT (id) DO NOTHING;
END $$;

-- 2. Asegurar Profiles (idempotente)
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

-- 3. Establecimientos (Farms en Corrientes)
INSERT INTO public.farms (id, owner_id, name, zone, province, approximate_lat, approximate_lng)
VALUES
    ('44444444-4444-4000-8000-000000000001', '11111111-1111-4000-8000-000000000001', 'La Querencia (DEMO)', 'Curuzú Cuatiá', 'Corrientes', -29.7891, -58.0543),
    ('44444444-4444-4000-8000-000000000002', '11111111-1111-4000-8000-000000000002', 'El Ombú (DEMO)', 'Curuzú Cuatiá', 'Corrientes', -29.7541, -58.0122),
    ('44444444-4444-4000-8000-000000000003', '11111111-1111-4000-8000-000000000003', 'Rincón del Yvy (DEMO)', 'Curuzú Cuatiá', 'Corrientes', -29.8120, -58.0934),
    ('44444444-4444-4000-8000-000000000004', '11111111-1111-4000-8000-000000000004', 'Los Cardales (DEMO)', 'Curuzú Cuatiá', 'Corrientes', -29.7712, -58.0311),
    ('44444444-4444-4000-8000-000000000005', '11111111-1111-4000-8000-000000000005', 'Pastizales del Iberá (DEMO)', 'Santo Tomé', 'Corrientes', -28.5489, -56.0421)
ON CONFLICT (id) DO NOTHING;

-- 4. Pools de Venta
-- Pool 1: 400 Novillos Curuzú Cuatiá (Inicial 350 cabezas)
-- Pool 2: 200 Vaquillonas Santo Tomé (Inicial 110 cabezas)
INSERT INTO public.sales_pools (id, title, zone, category, target_heads, status, created_by)
VALUES
    ('66666666-6666-4000-8000-000000000001', 'Pool Novillos Curuzú Cuatiá 400 (DEMO)', 'Curuzú Cuatiá', 'novillo', 400, 'abierto', '33333333-3333-4000-8000-000000000001'),
    ('66666666-6666-4000-8000-000000000002', 'Pool Vaquillonas NEA Norte 200 (DEMO)', 'Santo Tomé', 'vaquillona', 200, 'abierto', '33333333-3333-4000-8000-000000000001')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    target_heads = EXCLUDED.target_heads;

-- 5. Lotes Ganaderos (8 Lotes)
INSERT INTO public.livestock_lots (id, producer_id, farm_id, title, category, breed, head_count, average_weight_kg, electronic_tag_reference, verification_status, status)
VALUES
    -- Lote 1: Productor A (120 novillos) -> Adherido a Pool 1 (reservado)
    ('55555555-5555-4000-8000-000000000001', '11111111-1111-4000-8000-000000000001', '44444444-4444-4000-8000-000000000001', '120 Novillos Braford Marca Líquida (DEMO)', 'novillo', 'Braford', 120, 385.00, 'TAG-CC-001', 'declarado', 'reservado'),
    -- Lote 2: Productor B (80 novillos) -> Adherido a Pool 1 (reservado)
    ('55555555-5555-4000-8000-000000000002', '11111111-1111-4000-8000-000000000002', '44444444-4444-4000-8000-000000000002', '80 Novillos Brangus Colorados (DEMO)', 'novillo', 'Brangus', 80, 390.00, 'TAG-CC-002', 'declarado', 'reservado'),
    -- Lote 3: Productor C (150 novillos) -> Adherido a Pool 1 (reservado)
    -- Total inicial Pool 1 = 120 + 80 + 150 = 350 novillos!
    ('55555555-5555-4000-8000-000000000003', '11111111-1111-4000-8000-000000000003', '44444444-4444-4000-8000-000000000003', '150 Novillos Braford Pesados (DEMO)', 'novillo', 'Braford', 150, 410.00, 'TAG-CC-003', 'declarado', 'reservado'),
    -- Lote 4: Productor D (50 novillos) -> ¡DISPONIBLE PARA COMPLETAR DE 350 A 400!
    ('55555555-5555-4000-8000-000000000004', '11111111-1111-4000-8000-000000000004', '44444444-4444-4000-8000-000000000004', '50 Novillos Braford Seleccionados (DEMO)', 'novillo', 'Braford', 50, 395.00, 'TAG-CC-004', 'declarado', 'disponible'),
    -- Lote 5: Productor D (70 terneros) -> disponible
    ('55555555-5555-4000-8000-000000000005', '11111111-1111-4000-8000-000000000004', '44444444-4444-4000-8000-000000000004', '70 Terneros Braford Destete (DEMO)', 'ternero', 'Braford', 70, 180.00, 'TAG-CC-005', 'declarado', 'disponible'),
    -- Lote 6: Productor E (110 vaquillonas) -> Adherido a Pool 2 (reservado)
    ('55555555-5555-4000-8000-000000000006', '11111111-1111-4000-8000-000000000005', '44444444-4444-4000-8000-000000000005', '110 Vaquillonas Brangus para Entore (DEMO)', 'vaquillona', 'Brangus', 110, 290.00, 'TAG-ST-001', 'declarado', 'reservado'),
    -- Lote 7: Productor E (90 vaquillonas) -> disponible
    ('55555555-5555-4000-8000-000000000007', '11111111-1111-4000-8000-000000000005', '44444444-4444-4000-8000-000000000005', '90 Vaquillonas Braford (DEMO)', 'vaquillona', 'Braford', 90, 285.00, 'TAG-ST-002', 'declarado', 'disponible'),
    -- Lote 8: Productor B (60 terneras) -> disponible
    ('55555555-5555-4000-8000-000000000008', '11111111-1111-4000-8000-000000000002', '44444444-4444-4000-8000-000000000002', '60 Terneras Brangus Puras (DEMO)', 'ternera', 'Brangus', 60, 175.00, 'TAG-CC-006', 'declarado', 'disponible')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    head_count = EXCLUDED.head_count,
    average_weight_kg = EXCLUDED.average_weight_kg;

-- 6. Adhesiones de Miembros al Pool (Pool 1: 120 + 80 + 150 = 350 cabezas)
DELETE FROM public.pool_members WHERE pool_id IN (
    '66666666-6666-4000-8000-000000000001',
    '66666666-6666-4000-8000-000000000002'
);

INSERT INTO public.pool_members (pool_id, lot_id, joined_at)
VALUES
    ('66666666-6666-4000-8000-000000000001', '55555555-5555-4000-8000-000000000001', now() - interval '3 hours'),
    ('66666666-6666-4000-8000-000000000001', '55555555-5555-4000-8000-000000000002', now() - interval '2 hours'),
    ('66666666-6666-4000-8000-000000000001', '55555555-5555-4000-8000-000000000003', now() - interval '1 hour'),
    ('66666666-6666-4000-8000-000000000002', '55555555-5555-4000-8000-000000000006', now() - interval '4 hours');

-- 7. Historial Inicial de Eventos Comerciales
DELETE FROM public.commercial_events WHERE pool_id = '66666666-6666-4000-8000-000000000001';

INSERT INTO public.commercial_events (pool_id, actor_id, event_type, details, created_at)
VALUES
    ('66666666-6666-4000-8000-000000000001', '33333333-3333-4000-8000-000000000001', 'pool_created', '{"title":"Pool Novillos Curuzú Cuatiá 400 (DEMO)","target_heads":400,"category":"novillo","zone":"Curuzú Cuatiá"}'::jsonb, now() - interval '4 hours'),
    ('66666666-6666-4000-8000-000000000001', '11111111-1111-4000-8000-000000000001', 'lot_joined', '{"producer":"Don Juan Romero","head_count":120,"total_heads_now":120}'::jsonb, now() - interval '3 hours'),
    ('66666666-6666-4000-8000-000000000001', '11111111-1111-4000-8000-000000000002', 'lot_joined', '{"producer":"Doña Carmen Silva","head_count":80,"total_heads_now":200}'::jsonb, now() - interval '2 hours'),
    ('66666666-6666-4000-8000-000000000001', '11111111-1111-4000-8000-000000000003', 'lot_joined', '{"producer":"Cabaña Las Lilas NEA","head_count":150,"total_heads_now":350}'::jsonb, now() - interval '1 hour');
