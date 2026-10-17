/**
 * Mensajería interna — ADAPTADOR TEMPORAL CON DATOS DE DEMOSTRACIÓN.
 *
 * El backend todavía no tiene mensajes. Las pantallas usan solo la interfaz
 * `MensajesAdapter`; cuando exista la API, se reemplaza `demoAdapter` por una
 * implementación que llame al backend y no hay que tocar ninguna pantalla.
 *
 * Los datos viven en memoria del servidor: se pierden al reiniciar y son
 * iguales para todos los usuarios. Se muestran marcados como demostración.
 */
import type { Profile, UserRole } from "@/lib/types/domain";
import { CONTACT_INFO_ERROR, containsContactInfo } from "@/lib/front/contact-filter";

export interface Participante {
  nombre: string;
  rol: UserRole;
}

export interface Mensaje {
  id: string;
  autor: Participante;
  autorId: string;
  texto: string;
  fecha: string;
}

export interface Conversacion {
  id: string;
  asunto: string;
  contexto: string;
  poolId: string | null;
  lotId: string | null;
  participantes: Participante[];
  mensajes: Mensaje[];
  leidaPor: Record<string, string>;
}

export interface ConversacionResumen {
  id: string;
  asunto: string;
  contexto: string;
  ultimo: Mensaje | null;
  sinLeer: boolean;
}

export type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

export interface MensajesAdapter {
  readonly esDemo: boolean;
  bandeja(perfil: Profile): Promise<ConversacionResumen[]>;
  conversacion(perfil: Profile, id: string): Promise<Conversacion | null>;
  iniciar(
    perfil: Profile,
    datos: { poolId?: string | null; lotId?: string | null; asunto: string; contexto: string; texto: string }
  ): Promise<Resultado<{ id: string }>>;
  enviar(perfil: Profile, id: string, texto: string): Promise<Resultado<{ id: string }>>;
  marcarLeida(perfil: Profile, id: string): Promise<void>;
  sinLeer(perfil: Profile): Promise<number>;
}

// ------------------------------------------------------------------ demo
const MARTILLERO: Participante = { nombre: "Martillero YvyTape", rol: "operador" };
const store: { conversaciones: Conversacion[]; seq: number } = { conversaciones: [], seq: 1 };

function nuevoId(prefijo: string) {
  store.seq += 1;
  return `${prefijo}-${store.seq}`;
}

function validar(texto: string): string | null {
  const t = (texto ?? "").trim();
  if (!t) return "Escribí un mensaje.";
  if (t.length > 1000) return "El mensaje puede tener hasta 1000 caracteres.";
  if (containsContactInfo(t)) return CONTACT_INFO_ERROR;
  return null;
}

function yo(perfil: Profile): Participante {
  return { nombre: perfil.full_name, rol: perfil.role };
}

/** Siembra una conversación de ejemplo la primera vez que alguien entra. */
function sembrar(perfil: Profile) {
  if (store.conversaciones.some((c) => c.id === "demo-ayuda")) return;
  const hace = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
  store.conversaciones.push({
    id: "demo-ayuda",
    asunto: "Bienvenida a YvyTape",
    contexto: "Consulta al equipo YvyTape",
    poolId: null,
    lotId: null,
    participantes: [MARTILLERO, yo(perfil)],
    mensajes: [
      {
        id: "demo-m1",
        autor: MARTILLERO,
        autorId: "operador-demo",
        texto:
          "¡Hola! Por acá podés hacernos cualquier consulta. Todo queda dentro de YvyTape: no hace falta compartir teléfonos.",
        fecha: hace(90),
      },
    ],
    leidaPor: {},
  });
}

// TODO(backend): mensajería real (tablas conversaciones/mensajes + RLS). Este adaptador vive en memoria:
//   se borra al reiniciar y en Vercel cada instancia tiene su copia, así que no sirve para producción.
// TODO(backend): repetir en el servidor el filtro de contactos (teléfonos, correos, enlaces).
const demoAdapter: MensajesAdapter = {
  esDemo: true,

  async bandeja(perfil) {
    sembrar(perfil);
    return [...store.conversaciones]
      .sort((a, b) => (b.mensajes.at(-1)?.fecha ?? "").localeCompare(a.mensajes.at(-1)?.fecha ?? ""))
      .map((c) => {
        const ultimo = c.mensajes.at(-1) ?? null;
        const leida = c.leidaPor[perfil.id];
        return {
          id: c.id,
          asunto: c.asunto,
          contexto: c.contexto,
          ultimo,
          sinLeer: !!ultimo && ultimo.autorId !== perfil.id && (!leida || ultimo.fecha > leida),
        };
      });
  },

  async conversacion(perfil, id) {
    sembrar(perfil);
    return store.conversaciones.find((c) => c.id === id) ?? null;
  },

  async iniciar(perfil, datos) {
    const err = validar(datos.texto) ?? (containsContactInfo(datos.asunto) ? CONTACT_INFO_ERROR : null);
    if (err) return { error: err };
    const existente = store.conversaciones.find(
      (c) => c.poolId === (datos.poolId ?? null) && c.lotId === (datos.lotId ?? null) && c.participantes.some((p) => p.nombre === perfil.full_name)
    );
    const ahora = new Date().toISOString();
    const mensaje: Mensaje = { id: nuevoId("m"), autor: yo(perfil), autorId: perfil.id, texto: datos.texto.trim(), fecha: ahora };
    if (existente) {
      existente.mensajes.push(mensaje);
      existente.leidaPor[perfil.id] = ahora;
      return { data: { id: existente.id } };
    }
    const conv: Conversacion = {
      id: nuevoId("c"),
      asunto: datos.asunto.trim(),
      contexto: datos.contexto,
      poolId: datos.poolId ?? null,
      lotId: datos.lotId ?? null,
      participantes: [yo(perfil), MARTILLERO],
      mensajes: [mensaje],
      leidaPor: { [perfil.id]: ahora },
    };
    store.conversaciones.push(conv);
    return { data: { id: conv.id } };
  },

  async enviar(perfil, id, texto) {
    const err = validar(texto);
    if (err) return { error: err };
    const conv = store.conversaciones.find((c) => c.id === id);
    if (!conv) return { error: "La conversación no existe." };
    const ahora = new Date().toISOString();
    const mensaje: Mensaje = { id: nuevoId("m"), autor: yo(perfil), autorId: perfil.id, texto: texto.trim(), fecha: ahora };
    conv.mensajes.push(mensaje);
    if (!conv.participantes.some((p) => p.nombre === perfil.full_name)) conv.participantes.push(yo(perfil));
    conv.leidaPor[perfil.id] = ahora;
    return { data: { id: mensaje.id } };
  },

  async marcarLeida(perfil, id) {
    const conv = store.conversaciones.find((c) => c.id === id);
    if (conv) conv.leidaPor[perfil.id] = new Date().toISOString();
  },

  async sinLeer(perfil) {
    return (await this.bandeja(perfil)).filter((c) => c.sinLeer).length;
  },
};

/** Punto único de cambio: reemplazar por el adaptador real cuando exista la API. */
export const mensajes: MensajesAdapter = demoAdapter;
