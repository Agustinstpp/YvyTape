# YVYPASS — Guía de Despliegue en Vercel y Configuración de Producción

> **Versión:** 1.0.0  
> **Estado:** LISTO PARA DESPLIEGUE CONTINUO  
> **Responsable:** Persona 4 (Despliegue, QA e Integración)  
> **Fecha:** Ideathon Corrientes 2026

---

## 1. Requisitos Previos y Entorno

- **Framework:** Next.js 15.1.0 (App Router)
- **Runtime:** Node.js 20.x o superior
- **Plataforma:** Vercel (Edge & Serverless Node.js)
- **Base de Datos & Auth:** Supabase PostgreSQL con RLS

---

## 2. Variables de Entorno Requeridas en Vercel

Configurar en el panel de **Vercel Project Settings $\rightarrow$ Environment Variables**:

| Variable | Tipo | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client / Server | URL pública del proyecto Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client / Server | Clave pública anónima de Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

> [!CAUTION]
> **Nunca agregar la clave de servicio (`SUPABASE_SERVICE_ROLE_KEY`)** en variables con prefijo `NEXT_PUBLIC_` para evitar su exposición en el bundle del cliente.

---

## 3. Preparación del Build y Dependencias

El proyecto utiliza:
- `leaflet` y `react-leaflet` para la cartografía.
- `@types/leaflet` para soporte TypeScript estricto.
- Componentes cliente dinámicos con `ssr: false` para evitar errores de renderizado del lado del servidor (`window is not defined`).

### Comandos de Validación Local antes de Desplegar:
```bash
# 1. Verificación de Tipos Estrictos
npx tsc --noEmit

# 2. Ejecución de la Suite Completa de Pruebas Unitarias
npm test

# 3. Compilación de Producción de Next.js
npm run build
```

---

## 4. Despliegue en Vercel

### Opción A: Despliegue mediante GitHub (Recomendado para CI/CD)
1. Abrir Pull Request de la rama `feat/geografia-logistica` hacia la rama principal o de integración.
2. Vercel creará automáticamente un **Preview Deployment**.
3. Verificar la URL efímera generada.
4. Tras validación del equipo, fusionar el PR para disparar el despliegue a **Production**.

### Opción B: Despliegue directo mediante Vercel CLI
```bash
npx vercel --prod
```

---

## 5. Protocolo de Validación Post-Despliegue (Smoke Testing en Vivo)

Una vez obtenida la URL pública de producción (ej. `https://yvypass.vercel.app`):

1. **Acceso Inicial:** Abrir la URL en navegador de escritorio y teléfono móvil (ancho 375 px).
2. **Consola del Navegador:** Verificar ausencia de errores críticos rojos (especialmente fallas de hidratación o llamadas fallidas a APIs).
3. **Módulo Mapa (`/mapa`):**
   - Comprobar que los azulejos de OpenStreetMap carguen con fluidez.
   - Probar zoom in / zoom out.
   - Filtrar por "Mercedes" o "Novillos" y comprobar que la vista responde instantáneamente.
   - Pulsar un marcador de Pool (verde) y un marcador de Lote (ámbar) para validar el popup y el botón "Ver Detalle".
4. **Módulo Flete (`/flete`):**
   - Probar el botón "Cargar Escenario Demo (40 cab. / 200 km)".
   - Comprobar que el resultado total arroje **$ 440.000** y el costo unitario **$ 11.000 / cabeza**.
   - Ingresar 55 cabezas y verificar que aparezca la advertencia de exceso de capacidad vehicular.
   - Probar la pestaña "Comparativa" para visualizar el ahorro porcentual del productor.
5. **WhatsApp:** Pulsar el botón "Compartir Pool en WhatsApp" y verificar que redirija a `https://wa.me/?text=...` con el texto comercial bien codificado.
