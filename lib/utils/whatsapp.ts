/**
 * YVYPASS — WhatsApp Integration Utilities
 * Generación segura de enlaces wa.me con mensajes comerciales precargados y redirección a la plataforma.
 *
 * REGLAS:
 * - Normaliza números a formato internacional (E.164 sin símbolos ni ceros locales).
 * - Codifica textos con encodeURIComponent.
 * - No expone teléfonos privados sin consentimiento.
 * - Si no hay teléfono verificado, permite compartir el pool en el WhatsApp propio del usuario.
 * - Sin bots ni llamadas a APIs de Meta en el MVP.
 */

/**
 * Normaliza un número telefónico argentino o internacional para el formato requerido por wa.me.
 * Ejemplo de entrada: "+54 9 379 412-3456", "03794123456", "3794123456"
 * Ejemplo de salida: "5493794123456"
 */
export function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null;

  // Eliminar todo lo que no sea dígito
  let digits = phone.replace(/\D/g, "");

  if (!digits) return null;

  // Caso: número nacional con prefijo '0' (ej: 03794...) -> quitar 0 inicial y anteponer 549
  if (digits.startsWith("0")) {
    digits = "549" + digits.slice(1);
  }

  // Caso: ya tiene prefijo 54 pero le falta el '9' de celular argentino (ej: 543794...)
  if (digits.startsWith("54") && !digits.startsWith("549") && digits.length >= 12) {
    digits = "549" + digits.slice(2);
  }

  // Caso: número local sin código de país (ej: 3794123456 -> 10 dígitos)
  if (!digits.startsWith("54") && digits.length === 10) {
    digits = "549" + digits;
  }

  // Validar longitud internacional estándar de wa.me (mínimo 10, máximo 15 dígitos)
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return digits;
}

/**
 * Construye un enlace directo a wa.me con número validado y mensaje codificado.
 * Si el teléfono no es válido, retorna cadena vacía para evitar enlaces rotos o inseguros.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = normalizePhoneNumber(phone);
  if (!cleanPhone) {
    return "";
  }

  const encodedMessage = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Construye un enlace para compartir un pool o lote en WhatsApp
 * sin destinatario específico, permitiendo al usuario enviarlo a sus contactos o grupos.
 */
export function buildShareLink(message: string): string {
  const encodedMessage = encodeURIComponent(message.trim());
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Genera el mensaje precargado estándar para consultar sobre un pool de venta conjunta.
 */
export function createPoolInquiryMessage(params: {
  poolTitle: string;
  zone: string;
  detailUrl: string;
}): string {
  const url = params.detailUrl.startsWith("http")
    ? params.detailUrl
    : `https://yvypass.vercel.app${params.detailUrl}`;

  return `Hola, estoy interesado en conocer más sobre el "${params.poolTitle}" en ${params.zone} publicado en YvyPass. ¿Podemos conversar? Más información en: ${url}`;
}

/**
 * Genera el mensaje estándar para invitar a otros productores a sumarse a un pool abierto.
 */
export function createSharePoolMessage(params: {
  poolTitle: string;
  zone: string;
  currentHeads: number;
  targetHeads: number;
  detailUrl: string;
}): string {
  const url = params.detailUrl.startsWith("http")
    ? params.detailUrl
    : `https://yvypass.vercel.app${params.detailUrl}`;

  return `¡Hola! Te invito a sumarte al pool de venta conjunta "${params.poolTitle}" en ${params.zone}. Ya reunimos ${params.currentHeads}/${params.targetHeads} cabezas para negociar mejores precios y flete compartido. Podés ver el detalle y adherir tu lote acá: ${url}`;
}
