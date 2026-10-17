/**
 * Validación de pantalla: avisa antes de enviar si un mensaje incluye datos de
 * contacto externos (teléfonos, correos, enlaces, WhatsApp u otras redes).
 * Decisión de producto: toda la comunicación queda dentro de YvyTape.
 * El control definitivo debería hacerlo también el backend.
 */
export const CONTACT_INFO_ERROR =
  "Por seguridad, no se pueden compartir teléfonos, correos ni enlaces. Toda la conversación queda dentro de YvyTape.";

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/;
const URL_PREFIX = /(https?:\/\/|www\.)/;
const DOMAIN = /(^|[^a-z0-9-])[a-z0-9-]+\.(com|net|org|ar|me|ly|io|app|info|link)(?![a-z0-9])/;
const EXTERNAL_CHANNEL =
  /(^|[^a-záéíóúñ])(whats\s*app|wsp|wpp|wapp|telegram|instagram|facebook|messenger|gmail|hotmail|arroba|llamame|escribime al|mi n[uú]mero)(?![a-záéíóúñ])/;
const MONEY = /\$\s*[\d.,]+/g;
const THOUSANDS = /(^|[^\d])\d{1,3}(\.\d{3})+(,\d+)?(?!\d)/g;
const PHONE_LIKE = /\+?\(?\d[\d\s().-]{6,}\d/g;

export function containsContactInfo(text: string): boolean {
  let value = (text ?? "").toLowerCase();
  if (EMAIL.test(value) || URL_PREFIX.test(value) || DOMAIN.test(value)) return true;
  if (EXTERNAL_CHANNEL.test(value)) return true;
  value = value.replace(MONEY, " ").replace(THOUSANDS, "$1 ");
  for (const match of value.match(PHONE_LIKE) ?? []) {
    if (match.replace(/\D/g, "").length >= 8) return true;
  }
  return false;
}
