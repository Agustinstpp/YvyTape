# LIMITACIONES CONOCIDAS Y ALCANCE DEL MVP — YVYTAPE
**Fecha de Publicación:** 17 de Octubre de 2026  
**Versión:** 0.1.0 MVP

---

## 1. Alcance Deliberado del MVP
El propósito del MVP de YvyTape es validar técnica y comercialmente la **adhesión colaborativa de lotes ganaderos, la interacción entre productores, compradores y consignatarios, y el cálculo logístico compartido en el NEA**.

En concordancia con las reglas de desarrollo del Ideathon Corrientes 2026, las siguientes áreas no forman parte del MVP y están identificadas como futuras etapas de maduración del producto:

### 1.1 Pasarela de Pagos y Liquidación Formal
* **Estado Actual:** El MVP concluye la etapa comercial con el cierre de la oferta por parte del operador (`rpc_close_pool`), cambiando el estado de los animales a `vendido` y emitiendo un evento auditable.
* **Limitación Conocida:** La liquidación formal (emisión de Documentos de Tránsito Electrónico DTE / SENASA, boletos de compraventa, retenciones fiscales AFIP/DGR y transferencias bancarias STT/COELSA) no se procesa dentro del sistema. Dichas gestiones son coordinadas fuera de la plataforma por la casa consignataria autorizada.

### 1.2 Georreferenciación y Optimización de Rutas Logísticas
* **Estado Actual:** El catálogo utiliza centroides de localidades y departamentos reconocidos de la Provincia de Corrientes (Curuzú Cuatiá, Mercedes, Goya, etc.) con dispersión pseudo-aleatoria para evitar colisiones visuales de pines.
* **Limitación Conocida:**
  1. No se realiza geolocalización satelital exacta de corrales ni catastro privado por diseño de confidencialidad del productor.
  2. El cálculo de distancias de flete se efectúa mediante distancias geodésicas (Haversine) ajustadas con un coeficiente de sinuosidad vial estándar. No se incluye un motor de optimización de rutas con trazabilidad de peajes o estado dinámico de caminos de tierra.

### 1.3 Mensajería en Tiempo Real (WebSockets / Supabase Realtime)
* **Estado Actual:** La mensajería es 100% persistente en PostgreSQL con control estricto de acceso (RLS) y filtro de desintermediación en el servidor.
* **Limitación Conocida:** La actualización de nuevos mensajes entrantes se refleja al navegar, enviar o refrescar la pantalla (`revalidatePath`). No se habilitaron canales de WebSockets bidireccionales en vivo (`supabase.channel().on(...)`) para priorizar la estabilidad de conexiones serverless en Vercel durante el evento.

### 1.4 Notificaciones Externas
* **Estado Actual:** Los avisos comerciales y solicitudes pendientes se muestran en el panel interno del productor (`/mensajes` y `/inicio`).
* **Limitación Conocida:** No se envían notificaciones push móviles ni mensajes automatizados por SMS/WhatsApp API, garantizando que ninguna información sensible de contacto salga de la plataforma.

---

## 2. Recomendaciones para Próximos Sprints
1. **Integración con API SENASA:** Automatización de validación de marcas y caravanas electrónicas contra el Sistema Integrado de Gestión de Sanidad Animal (SIGSA).
2. **Realtime Subscriptions:** Suscripción reactiva a eventos comerciales en el panel del martillero mediante Supabase Realtime.
3. **Módulo de Transportistas Homologados:** Panel para empresas de transporte de hacienda con habilitación SENASA para cotizar en tiempo real los fletes compartidos.
