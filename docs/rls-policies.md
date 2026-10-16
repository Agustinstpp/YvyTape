# YVYPASS — Políticas de Seguridad y Row Level Security (RLS)

> **Ubicación de Migración:** `supabase/migrations/20261016000002_rls_policies.sql`  
> **Estado:** ACTIVO Y OBLIGATORIO EN TODAS LAS TABLAS  
> **Responsable:** Persona 1 (Backend, Database & Security)

---

## 1. Principios de Seguridad No Negociables

1. **Nunca confiar en el cliente:** No se confía en ningún parámetro `user_id` o `role` recibido desde el frontend. Toda identidad se resuelve criptográficamente mediante `auth.uid()` y la función protegida `get_current_user_role()`.
2. **Defensa contra escalamiento de privilegios:** Un usuario con rol `productor` no puede modificarse a sí mismo a `comprador` u `operador`. Un trigger en PostgreSQL (`trg_prevent_role_modification`) rechaza cualquier intento de UPDATE sobre la columna `role` si no proviene del `service_role`.
3. **Mínimo Privilegio:** Los compradores no pueden ver coordenadas exactas de campos ni números de teléfono particulares. Los productores solo pueden alterar sus propios lotes en estado disponible.
4. **Service Role Aislado:** La clave `service_role` de Supabase se utiliza estrictamente en scripts administrativos o migraciones de servidor y nunca se expone en código accesible al navegador ni en variables `NEXT_PUBLIC_*`.

---

## 2. Matriz de Autorización por Rol

| Tabla | Operación | Productor | Comprador | Operador | Público / Anónimo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **profiles** | SELECT | Todos los perfiles | Todos los perfiles | Todos los perfiles | No |
| | UPDATE | Solo su propio perfil (sin rol) | Solo su propio perfil (sin rol) | Solo su propio perfil | No |
| **farms** | SELECT | Todos los campos | Todos los campos | Todos los campos | No |
| | INSERT/UPDATE/DEL | Solo sus propios campos | No | No | No |
| **livestock_lots** | SELECT | Lotes propios + disponibles | Lotes disponibles | Todos los lotes | Lotes disponibles |
| | INSERT | Solo lotes propios en farms propias | No | No | No |
| | UPDATE | Solo lotes propios disponibles | No | No | No |
| **sales_pools** | SELECT | Catálogo completo | Catálogo completo | Catálogo completo | Catálogo completo |
| | INSERT | Sí (si habilitado) | No | Sí | No |
| | UPDATE | Solo vía RPC transaccional | Solo vía RPC | Operaciones autorizadas | No |
| **pool_members** | SELECT | Miembros de cualquier pool | Miembros de cualquier pool | Miembros | Miembros |
| | INSERT/DELETE | Solo su propio lote vía RPC | No | Solo vía RPC | No |
| **offers** | SELECT | Ofertas de sus pools | Sus propias ofertas | Todas las ofertas | No |
| | INSERT | No | Solo comprador vía RPC | No | No |
| **offer_confirmations** | SELECT | Miembros del pool | Ofertas que emitió | Todas | No |
| | INSERT | Sí (solo su voto vía RPC) | No | No | No |
| **commercial_events** | SELECT | Historial completo de auditoría | Historial completo | Historial completo | Historial público |
| | INSERT | Solo vía backend RPC | Solo vía backend RPC | Solo vía backend RPC | No |

---

## 3. Función Segura `get_current_user_role()`

```sql
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

Esta función es `SECURITY DEFINER` y lee directamente de la tabla `profiles` el rol verificado del usuario que ejecuta la consulta, garantizando que ninguna cookie adulterada pueda inyectar un rol falso.

---

## 4. Protección contra Auto-Escalamiento de Rol

```sql
CREATE OR REPLACE FUNCTION public.prevent_role_modification()
RETURNS TRIGGER AS $$
BEGIN
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
```

---

## 5. Pruebas de Cumplimiento de Seguridad

Las pruebas automatizadas en `tests/business-rules.test.ts` verifican:
- Rechazo inmediato de solicitudes sin token de sesión (Caso 9).
- Rechazo a edición de lotes de terceros (Caso 10).
- Rechazo a compradores que intenten adherir lotes (Caso 11).
- Rechazo de adhesión si la categoría o la zona no coinciden (Caso 12).
- Rechazo a doble adhesión concurrente (Caso 13 y 14).
- Rechazo si el lote excede el objetivo del pool (Caso 15).
- Rechazo de alteración de rol (Caso 16).
- Rechazo a confirmaciones cruzadas (Caso 17).
- Rechazo a compradores intentando cerrar transacciones (Caso 18).
