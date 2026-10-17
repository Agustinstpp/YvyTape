# GUION DE DEMOSTRACIÓN END-TO-END — YVYTAPE MVP
**Objetivo:** Demostrar en vivo el flujo completo de comercialización ganadera colaborativa en el NEA argentino utilizando cuatro roles diferenciados.

---

## 1. Cuentas de Demostración

| Rol | Correo | Contraseña | Perfil / Contexto |
| :--- | :--- | :--- | :--- |
| **Productor A** | `productor.a@yvypass.com.ar` | `YvyPass2026!` | Don Juan Romero (Curuzú Cuatiá) — Aporta 120 novillos al pool base |
| **Productor B** | `productor.d@yvypass.com.ar` | `YvyPass2026!` | Don Pedro Morales (Curuzú Cuatiá) — Tiene 50 novillos disponibles para completar el pool |
| **Comprador** | `comprador.litoral@yvypass.com.ar` | `YvyPass2026!` | Frigorífico del Litoral (Corrientes Capital) — Interesado en volumen de 400 novillos |
| **Operador** | `operador@yvypass.com.ar` | `YvyPass2026!` | Operador Consignatario NEA — Coordina y liquida operaciones |

---

## 2. Paso a Paso del Recorrido Demostrativo

### Paso 1: Exploración Pública y Mapa
1. Abrir la página principal `/`.
2. Visitar el `/mapa` interactivo:
   * Visualizar la distribución geográfica de lotes y pools en Corrientes (Curuzú Cuatiá, Mercedes, Santo Tomé).
   * Filtrar por categoría `novillo`.
   * Demostrar la preservación de privacidad: las coordenadas representan centroides de localidades públicas, nunca geolocalizaciones de cascos o corrales privados.

### Paso 2: Productor A consulta la Venta Conjunta en curso
1. Iniciar sesión con `productor.a@yvypass.com.ar` / `YvyPass2026!`.
2. El sistema redirige al panel `/inicio`.
3. Navegar a `/ventas-conjuntas/66666666-6666-4000-8000-000000000001` (Pool Novillos Curuzú Cuatiá 400).
4. **Verificación visual:** Se observa la barra de progreso en **350 / 400 cabezas** (87%).
5. Hacer clic en **"Simular flete compartido"**:
   * Se abre `/flete?venta=...`.
   * El simulador carga automáticamente los 3 productores participantes y el desglose proporcional de costo por cabeza.
   * Se demuestra el ahorro significativo frente al flete individual de cada productor.

### Paso 3: Convocatoria a Productores Cercanos
1. Desde la venta conjunta, pulsar **"Completá la venta"** (`/ventas-conjuntas/.../completar`).
2. Se muestra el mapa de radio geográfico (hasta 75 km):
   * Se detecta que Don Pedro Morales (`productor.d`) cuenta con un lote disponible de 50 novillos en la zona.
3. Hacer clic en **"Invitar a los más cercanos"**:
   * Se genera una consulta interna por mensajería dirigida a los participantes y al martillero.
4. Cerrar sesión (`/salir`).

### Paso 4: Productor B adhiere su lote y alcanza el Objetivo
1. Iniciar sesión con `productor.d@yvypass.com.ar` / `YvyPass2026!`.
2. Navegar a `/ventas-conjuntas/66666666-6666-4000-8000-000000000001`.
3. En el formulario de adhesión, seleccionar su lote de **50 Novillos Braford** y hacer clic en **"Sumar mi lote a la venta"**.
4. **Resultado inmediato:**
   * La transacción `rpc_join_pool` se ejecuta en Supabase.
   * El total de cabezas pasa de 350 a **400 / 400 cabezas (100%)**.
   * El estado del pool cambia automáticamente de `abierto` a **`objetivo_alcanzado`**.
   * El lote queda reservado, impidiendo doble venta o adhesión paralela.
5. Cerrar sesión.

### Paso 5: Comprador presenta Oferta Comercial
1. Iniciar sesión con `comprador.litoral@yvypass.com.ar` / `YvyPass2026!`.
2. Redirige a `/ofertas`.
3. El pool aparece listado como listo para recibir ofertas (`objetivo_alcanzado`).
4. Entrar al detalle y pulsar **"Presentar oferta"** (`/ventas-conjuntas/.../oferta`).
5. Ingresar precio indicativo: `$2.850` por kg vivo.
6. Enviar oferta:
   * La transacción `rpc_create_offer` registra la oferta y pasa el pool a estado **`en_negociacion`**.
7. Cerrar sesión.

### Paso 6: Productores confirman la Oferta
1. Iniciar sesión con `productor.a@yvypass.com.ar`.
2. Ingresar a la venta conjunta. Se muestra el banner con la oferta de **$2.850 / kg**.
3. Seleccionar **"Aceptar oferta"**:
   * `rpc_confirm_offer` registra su decisión afirmativa.
4. Cerrar sesión.
5. Iniciar sesión con los demás productores participantes (`productor.b`, `productor.c`, `productor.d`) para registrar sus aceptaciones.

### Paso 7: Operador cierra la Operación
1. Iniciar sesión con `operador@yvypass.com.ar` / `YvyPass2026!`.
2. Redirige a `/operador`.
3. Visualizar el pool en negociación con todas las confirmaciones afirmativas recibidas.
4. Hacer clic en **"Cerrar venta"**:
   * La función `rpc_close_pool` valida que el actor es operador y que todas las confirmaciones están completas.
   * La oferta pasa a estado `aceptada`.
   * El pool pasa a estado `cerrado`.
   * Todos los lotes miembros se marcan atómicamente como `vendido`.
   * Se registra el evento comercial inmutable en la bitácora `commercial_events`.

### Paso 8: Mensajería Interna Persistente
1. Navegar a `/mensajes`.
2. Comprobar que las conversaciones e invitaciones previas persisten correctamente en la bandeja.
3. Enviar un mensaje de confirmación de carga: *"Estimados productores y frigorífico: operación cerrada con éxito. El transporte comenzará la carga el martes 6:00 hs."*
4. Refrescar la página (`F5`) o cerrar e iniciar sesión para verificar que el mensaje se conserva intacto en la base de datos de Supabase.
