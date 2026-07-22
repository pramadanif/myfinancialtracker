const STORAGE_KEY = "finance-amount-shortcuts";
export const DEFAULT_AMOUNT_SHORTCUTS = [50_000, 100_000, 250_000, 500_000, 1_000_000];

export function loadAmountShortcuts(): number[] {
  if (typeof window === "undefined") return DEFAULT_AMOUNT_SHORTCUTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AMOUNT_SHORTCUTS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_AMOUNT_SHORTCUTS;
    const nums = parsed.filter((n): n is number => typeof n === "number" && n > 0);
    return nums.length > 0 ? nums.slice(0, 6) : DEFAULT_AMOUNT_SHORTCUTS;
  } catch {
    return DEFAULT_AMOUNT_SHORTCUTS;
  }
}

export function saveAmountShortcuts(amounts: number[]) {
  const clean = amounts.filter((n) => n > 0).slice(0, 6);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean.length > 0 ? clean : DEFAULT_AMOUNT_SHORTCUTS));
  }
}
