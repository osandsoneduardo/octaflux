/**
 * Normaliza uma URL fornecida pelo usuário.
 * - Aceita strings vazias (retorna "")
 * - Adiciona https:// se faltar protocolo
 * - Bloqueia esquemas perigosos (javascript:, data:, vbscript:, file:)
 * - Retorna "" se a URL for inválida (anti-XSS / anti-open-redirect lixo)
 */
export function safeExternalUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = String(raw).trim().replace(/\s+/g, "");
  if (!s) return "";

  // Corrige um erro comum ao colar convite de grupo sem o .com
  if (/^chat\.whatsapp\//i.test(s)) {
    s = s.replace(/^chat\.whatsapp\//i, "chat.whatsapp.com/");
  }

  // Bloqueia apenas esquemas perigosos
  const lower = s.toLowerCase();
  const dangerous = ["javascript:", "data:", "vbscript:", "file:", "about:"];
  if (dangerous.some((d) => lower.startsWith(d))) return "";

  // Aceita esquemas comuns como estão
  if (/^(mailto:|tel:|sms:|whatsapp:)/i.test(s)) return s;

  // Adiciona https:// se faltar protocolo
  if (!/^https?:\/\//i.test(s)) {
    s = "https://" + s.replace(/^\/+/, "");
  }

  // Tenta validar; se falhar, devolve a string mesmo assim (não bloqueia link do usuário)
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return s;
  }
}

/**
 * Valida se uma string parece uma URL HTTP(S) válida (para validação de form).
 */
export function isValidHttpUrl(raw: string): boolean {
  return safeExternalUrl(raw).length > 0;
}
