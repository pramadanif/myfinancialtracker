export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format seperti Money Manager: Rp 123.000,00 */
export function formatCurrencyLedger(amount: number): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rp ${formatted}`;
}

function formatShortUnit(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(".", ",");
}

export function formatCurrencyShort(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  if (abs >= 1_000_000) {
    return `${sign}Rp${formatShortUnit(abs / 1_000_000, 3)}jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp${formatShortUnit(abs / 1_000, 2)}rb`;
  }
  return formatCurrency(amount);
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

export function formatNumberInput(value: number): string {
  if (value === 0) return "";
  return value.toLocaleString("id-ID");
}

export function getBudgetStatusColor(percentage: number): string {
  if (percentage >= 100) return "status-danger";
  if (percentage > 80) return "status-warning";
  return "status-safe";
}

export function getBudgetStatusHex(percentage: number): string {
  if (percentage >= 100) return "#DC2626";
  if (percentage > 80) return "#F59E0B";
  return "#16A34A";
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
