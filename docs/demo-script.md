# YVYPASS — Guion de Demostración para el Jurado (Pitch & Demo Script)

> **Duración Máxima:** 3 Minutos (180 Segundos)  
> **Evento:** Ideathon Corrientes 2026  
> **Equipo:** YvyPass

---

## 1. Preparación Previa a la Presentación (Checklist)

- [ ] URL pública abierta en pestaña principal del navegador.
- [ ] Usuario Productor ("Don Pedro") logueado en una ventana de incógnito o perfil A.
- [ ] Usuario Comprador ("Frigorífico NEA") logueado en perfil B.
- [ ] Datos de demostración precargados (Pool en 350/400 cabezas en Mercedes; Lote de 50 novillos listo).
- [ ] Teléfono móvil listo con la URL pública para mostrar responsividad si el jurado lo solicita.

---

## 2. Cronograma de Exposición (Minuto a Minuto)

### 0:00 – 0:30 | El Problema del Productor Ganadero del NEA
> **Discurso del Orador:**  
> *"En Corrientes y el NEA, los pequeños y medianos productores ganaderos venden su hacienda de forma aislada. Con lotes chicos no tienen escala para negociar precios frente a grandes compradores y asumen fletes individuales altísimos con camiones semivacíos.  
> Hoy presentamos **YvyPass**, la plataforma de comercialización colaborativa que permite a los productores unir su ganado en pools de venta conjunta y compartir la logística."*

---

### 0:30 – 1:00 | El Mapa Ganadero Regional y Privacidad
> **Acción en Pantalla:** Navegar a la sección del Mapa Regional (`/mapa`).  
> **Mostrar:**
> 1. Visualización de Corrientes centrada en la provincia.
> 2. Filtro interactivo por zona (seleccionar "Mercedes") y categoría "Novillos".
> 3. Click en un marcador verde de **Pool de Venta Conjunta** y uno ámbar de **Lote Individual**.  
>
> **Discurso del Orador:**  
> *"Aquí vemos el mapa regional de ofertas. Para resguardar la seguridad y privacidad del productor, nunca publicamos coordenadas exactas de campos ni corrales; mostramos centroides zonales autorizados.  
> Un productor en Mercedes puede identificar qué lotes compatibles hay en su zona o sumarse a un pool abierto para alcanzar volumen de faena o exportación."*

---

### 1:00 – 1:50 | La Venta Conjunta (Pool de 350 a 400 Novillos)
> **Acción en Pantalla:** Ingresar al detalle del Pool "Pool Novillos NEA 400".  
> **Mostrar:**
> 1. Barra de progreso inicial en **350 / 400 cabezas** (3 productores ya adheridos).
> 2. El Productor D selecciona su lote de **50 novillos** y hace click en **"Adherir lote al pool"**.
> 3. El contador sube atómicamente a **400 / 400 cabezas** y el badge cambia a **"Objetivo Alcanzado"**.  
>
> **Discurso del Orador:**  
> *"Este pool necesitaba 400 novillos y ya contaba con 350. Nuestro productor adhiere su lote de 50 novillos.  
> Mediante una transacción segura en PostgreSQL, el pool alcanza el 100% de su objetivo comercial y queda listo para recibir ofertas en bloque."*

---

### 1:50 – 2:20 | El Simulador de Flete Compartido
> **Acción en Pantalla:** Abrir el Simulador de Flete (`/flete`).  
> **Mostrar:**
> 1. Parámetros del pliego: 200 km, 2 paradas intermedias, 40 cabezas.
> 2. Resultado: Costo total **$ 440.000**, costo por cabeza **$ 11.000**.
> 3. Cambiar a la pestaña **"Comparativa Individual vs. Pool"**: Mostrar cómo viajar solo le costaba al productor más de $ 26.000 por cabeza, logrando un **ahorro superior al 55%** al compartir la jaula.
> 4. Mostrar el botón **"Compartir en WhatsApp"**.  
>
> **Discurso del Orador:**  
> *"¿Cuál es el beneficio directo? Nuestro simulador logístico permite calcular el flete compartido. Para un traslado de 200 km con paradas, el costo se reduce a solo $ 11.000 por animal, logrando un ahorro de más del 50% comparado con contratar un camión exclusivo. Además, pueden compartir la convocatoria directamente por WhatsApp a otros productores vecinos."*

---

### 2:20 – 2:45 | La Oferta Comercial del Comprador
> **Acción en Pantalla:** Ventana del Comprador.  
> **Mostrar:**
> 1. El comprador ve el pool completo de 400 cabezas uniformes en Mercedes.
> 2. Emite una oferta indicativa de precio por kg.
> 3. Los productores confirman su aceptación desde la plataforma.  
>
> **Discurso del Orador:**  
> *"El comprador, en lugar de negociar con cuatro campos distintos por separado, encuentra en YvyPass un lote homogéneo de 400 novillos con un único precio de referencia y logística coordinada."*

---

### 2:45 – 3:00 | Cierre y Visión
> **Discurso del Orador:**  
> *"YvyPass transforma la atomización del productor en fuerza comercial y eficiencia logística para Corrientes.  
> Aclaramos que en este MVP las transacciones y cálculos son simulaciones demostrativas que validan el modelo económico.  
> ¡Muchas gracias y quedamos a disposición del jurado!"*
