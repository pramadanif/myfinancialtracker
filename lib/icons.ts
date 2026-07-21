import {
  UtensilsCrossed,
  Fuel,
  ShoppingBag,
  Smartphone,
  Package,
  Coins,
  Home,
  HeartPulse,
  Receipt,
  ShoppingCart,
  Ticket,
  Send,
  Banknote,
  ArrowLeftRight,
  Landmark,
  Wallet,
  Coffee,
  Zap,
  CircleDollarSign,
  TrendingUp,
  Building2,
  ChartPie,
  type LucideIcon,
} from "lucide-react";

/** Maps kebab-case icon names to Lucide components */
export const ICON_MAP: Record<string, LucideIcon> = {
  "utensils-crossed": UtensilsCrossed,
  utensils: UtensilsCrossed,
  fuel: Fuel,
  "shopping-bag": ShoppingBag,
  smartphone: Smartphone,
  package: Package,
  coins: Coins,
  home: Home,
  "heart-pulse": HeartPulse,
  receipt: Receipt,
  "shopping-cart": ShoppingCart,
  ticket: Ticket,
  send: Send,
  banknote: Banknote,
  "arrow-left-right": ArrowLeftRight,
  landmark: Landmark,
  wallet: Wallet,
  coffee: Coffee,
  zap: Zap,
  "circle-dollar-sign": CircleDollarSign,
  "trending-up": TrendingUp,
  "building-2": Building2,
  "chart-pie": ChartPie,
};

export const DEFAULT_CATEGORY_ICON = "circle-dollar-sign";
export const DEFAULT_SHORTCUT_ICON = "zap";

/** Default iconName per category name (for seed & fallback) */
export const CATEGORY_ICON_DEFAULTS: Record<string, string> = {
  "Makan & Minum": "utensils-crossed",
  Bensin: "fuel",
  Minimarket: "shopping-bag",
  "Top Up E-wallet": "smartphone",
  "Rokok & Oli": "package",
  "Lain-lain kecil": "coins",
  Kos: "home",
  Kesehatan: "heart-pulse",
  Tagihan: "receipt",
  "Belanja Retail": "shopping-cart",
  "Hotel/Hiburan/Nonton": "ticket",
  "Transfer ke Orang": "send",
  "Income/Gaji": "banknote",
  "Transfer Antar Akun": "arrow-left-right",
};

/** Account icon by name */
export function getAccountIconName(accountName: string): string {
  switch (accountName) {
    case "BCA":
    case "Seabank":
      return "landmark";
    case "Cash":
      return "wallet";
    default:
      return "landmark";
  }
}

export function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return CircleDollarSign;
  const normalized = name.toLowerCase().trim();
  return ICON_MAP[normalized] ?? CircleDollarSign;
}

export const CHART_COLORS = [
  "#0055A4",
  "#16A34A",
  "#F59E0B",
  "#DC2626",
  "#718096",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];
