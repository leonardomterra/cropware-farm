export function formatBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function formatDateBR(
  iso: string | null | undefined,
  fallback = "-",
): string {
  if (!iso) return fallback;
  // Aceita YYYY-MM-DD (sem timezone) ou full ISO.
  // YYYY-MM-DD parseado direto vira UTC midnight e podia virar dia anterior em pt-BR.
  // Truque: criar como local date.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = dateOnly
    ? new Date(`${iso}T12:00:00`)
    : new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("pt-BR");
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Converte input pt-BR ("1.234,56") em number. Tolerante:
 * - "1234.56" -> 1234.56
 * - "1234,56" -> 1234.56
 * - "1.234,56" -> 1234.56
 * - "" / invalid -> NaN
 */
export function parseBRLInput(raw: string): number {
  if (!raw) return NaN;
  const cleaned = raw.replace(/\s/g, "").replace(/[^\d.,-]/g, "");
  // Se tem virgula como decimal (caso brasileiro), tira pontos e troca virgula
  if (cleaned.includes(",")) {
    return Number(cleaned.replace(/\./g, "").replace(",", "."));
  }
  return Number(cleaned);
}
