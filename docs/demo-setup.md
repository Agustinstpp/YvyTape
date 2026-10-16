# YVYPASS — Guía de Configuración de Demostración (Demo Setup)

> **Ideathon Corrientes 2026**  
> **Escenario Comercial:** Venta Conjunta de 350 a 400 Novillos en Curuzú Cuatiá

---

## 1. Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto basándose en `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## 2. Aplicación de Migraciones en la Base de Datos

En Supabase SQL Editor o CLI de Supabase, ejecutar en estricto orden:

1. `supabase/migrations/20261016000001_initial_schema.sql` (Tablas, enums, triggers)
2. `supabase/migrations/20261016000002_rls_policies.sql` (Políticas de seguridad RLS)
3. `supabase/migrations/20261016000003_commercial_rpcs.sql` (Procedimientos transaccionales)

---

## 3. Carga de Datos de Demostración (Seed)

Existen dos alternativas según el entorno:

### Opción A (Supabase SQL Editor / CLI):
Ejecutar directamente el contenido de:
```text
supabase/seed.sql
```
Este script es **idempotente** e inserta tanto los usuarios en `auth.users` como los perfiles, campos, lotes, pools y el estado inicial de 350 novillos.

### Opción B (Script Administrativo Node/TypeScript):
Con las variables de entorno configuradas:
```bash
npm run seed:users
```

---

## 4. Usuarios de Prueba Disponibles

Todos los usuarios tienen como contraseña predeterminada: `YvyPass2026!`

| Email | Rol | Nombre DEMO | Zona | Acción Clave en la Demo |
| :--- | :--- | :--- | :--- | :--- |
| `productor.a@yvypass.com.ar` | `productor` | Don Juan Romero | Curuzú Cuatiá | Ya participa con 120 novillos |
| `productor.b@yvypass.com.ar` | `productor` | Doña Carmen Silva | Curuzú Cuatiá | Ya participa con 80 novillos |
| `productor.c@yvypass.com.ar` | `productor` | Cabaña Las Lilas NEA | Curuzú Cuatiá | Ya participa con 150 novillos |
| `productor.d@yvypass.com.ar` | `productor` | Don Pedro Morales | Curuzú Cuatiá | **Tiene el lote de 50 novillos para completar a 400** |
| `productor.e@yvypass.com.ar` | `productor` | Estancia Iberá | Santo Tomé | Productor de la zona norte |
| `comprador.litoral@yvypass.com.ar` | `comprador`| Frigorífico del Litoral | Corrientes Cap. | **Presenta oferta indicativa por kg** |
| `comprador.sa@yvypass.com.ar` | `comprador`| Carnes Correntinas SA | Goya | Comprador alternativo |
| `operador@yvypass.com.ar` | `operador` | Operador Consignatario | Corrientes | **Realiza el cierre demostrativo** |

---

## 5. Guion de la Demostración en Vivo (Paso a Paso)

### Paso 1: Estado Inicial (350 de 400 cabezas)
- Se ingresa a la vista de pools de venta.
- Se observa el **Pool Novillos Curuzú Cuatiá 400**.
- Estado: `abierto`.
- Cabezas acumuladas: **350 / 400** (Productor A: 120 + Productor B: 80 + Productor C: 150).
- Faltan 50 cabezas para alcanzar el objetivo comercial.

### Paso 2: Productor D adhiere su lote de 50 novillos
- Iniciar sesión como `productor.d@yvypass.com.ar`.
- Ir a sus lotes o al pool: seleccionar el lote de **50 Novillos Braford**.
- Clic en **Adherir al Pool**.
- **Resultado en backend:**
  - Se ejecuta la transacción atómica `rpc_join_pool`.
  - El lote pasa a `reservado`.
  - El total de cabezas pasa de 350 a **400 / 400**.
  - El estado del pool cambia automáticamente a **`objetivo_alcanzado`**.
  - Se emiten los eventos comerciales `lot_joined` y `pool_target_reached`.

### Paso 3: Comprador presenta Oferta Indicativa
- Iniciar sesión como `comprador.litoral@yvypass.com.ar`.
- El pool ahora está habilitado para recibir ofertas.
- El comprador ingresa una oferta indicativa de `$ 2.950 por kg`.
- **Resultado en backend:**
  - Se ejecuta `rpc_create_offer`.
  - El estado del pool pasa a **`en_negociacion`**.
  - Se emite el evento `offer_created`.

### Paso 4: Confirmaciones de los 4 Productores
- Iniciar sesión secuencialmente con los productores (o simular en UI de demo):
  - Productor A: Confirma oferta (Acepta).
  - Productor B: Confirma oferta (Acepta).
  - Productor C: Confirma oferta (Acepta).
  - Productor D: Confirma oferta (Acepta).
- **Resultado en backend:**
  - El backend registra cada voto en `offer_confirmations` impidiendo votos duplicados.
  - Al completar el 4to voto, `all_confirmed` se vuelve `true`.

### Paso 5: Operador ejecuta el Cierre Demostrativo
- Iniciar sesión como `operador@yvypass.com.ar`.
- El operador visualiza que el 100% de los productores han aceptado.
- Clic en **Cierre Comercial Demostrativo**.
- **Resultado en backend:**
  - Se ejecuta `rpc_close_pool`.
  - La oferta pasa a `aceptada`.
  - El pool pasa a `cerrado`.
  - Los 4 lotes pasan a `vendido`.
  - Se emite el evento final `pool_closed` con leyenda aclaratoria de que el cierre demostrativo requerirá en producción formalización documental.

---

## 6. Restablecer el Escenario de Demostración

Para reiniciar la demo a su estado inicial de 350 cabezas en cualquier momento, basta con ejecutar nuevamente `supabase/seed.sql` en la base de datos.
