import { PrismaClient } from "@prisma/client";
import { CategoryType } from "@/types/enums";
import { CATEGORY_ICON_DEFAULTS, DEFAULT_SHORTCUT_ICON } from "@/lib/icons";

const prisma = new PrismaClient();

async function main() {
  const accounts = await Promise.all([
    prisma.account.upsert({
      where: { name: "BCA" },
      update: {},
      create: { name: "BCA", colorTag: "#0055A4", currentBalance: 0 },
    }),
    prisma.account.upsert({
      where: { name: "Seabank" },
      update: {},
      create: { name: "Seabank", colorTag: "#FF6B00", currentBalance: 0 },
    }),
    prisma.account.upsert({
      where: { name: "Cash" },
      update: {},
      create: { name: "Cash", colorTag: "#16A34A", currentBalance: 0 },
    }),
  ]);

  const [bca, seabank, cash] = accounts;

  const categoriesData = [
    { name: "Makan & Minum", emoji: "", iconName: "utensils-crossed", type: CategoryType.DAILY_RECURRING, weeklyBudget: 350000 },
    { name: "Bensin", emoji: "", iconName: "fuel", type: CategoryType.DAILY_RECURRING, weeklyBudget: 90000 },
    { name: "Minimarket", emoji: "", iconName: "shopping-bag", type: CategoryType.DAILY_RECURRING, weeklyBudget: 50000 },
    { name: "Top Up E-wallet", emoji: "", iconName: "smartphone", type: CategoryType.DAILY_RECURRING, weeklyBudget: 50000 },
    { name: "Rokok & Oli", emoji: "", iconName: "package", type: CategoryType.DAILY_RECURRING, weeklyBudget: 50000 },
    { name: "Lain-lain kecil", emoji: "", iconName: "coins", type: CategoryType.DAILY_RECURRING, weeklyBudget: 30000 },
    { name: "Kos", emoji: "", iconName: "home", type: CategoryType.MONTHLY_FIXED, monthlyBudget: 800000 },
    { name: "Kesehatan", emoji: "", iconName: "heart-pulse", type: CategoryType.MONTHLY_FIXED, monthlyBudget: 100000 },
    { name: "Tagihan", emoji: "", iconName: "receipt", type: CategoryType.MONTHLY_FIXED, monthlyBudget: 60000 },
    { name: "Belanja Retail", emoji: "", iconName: "shopping-cart", type: CategoryType.LIFESTYLE, monthlyBudget: 500000 },
    { name: "Hotel/Hiburan/Nonton", emoji: "", iconName: "ticket", type: CategoryType.LIFESTYLE, monthlyBudget: 500000 },
    { name: "Transfer ke Orang", emoji: "", iconName: "send", type: CategoryType.LIFESTYLE, monthlyBudget: null },
    { name: "Income/Gaji", emoji: "", iconName: "banknote", type: CategoryType.INCOME },
    { name: "Transfer Antar Akun", emoji: "", iconName: "arrow-left-right", type: CategoryType.TRANSFER },
  ];

  const categories: Record<string, { id: string }> = {};
  for (const cat of categoriesData) {
    const iconName = cat.iconName || CATEGORY_ICON_DEFAULTS[cat.name] || "circle-dollar-sign";
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { iconName, emoji: "" },
      create: { ...cat, iconName },
    });
    categories[cat.name] = created;
  }

  const shortcutsData = [
    { label: "Warkop/Kopi", iconName: "coffee", accountId: cash.id, categoryId: categories["Makan & Minum"].id, defaultAmount: 10000 },
    { label: "Isi Bensin", iconName: "fuel", accountId: bca.id, categoryId: categories["Bensin"].id, defaultAmount: 90000 },
    { label: "Warung Makan", iconName: "utensils-crossed", accountId: cash.id, categoryId: categories["Makan & Minum"].id, defaultAmount: 20000 },
    { label: "Top Up ShopeePay", iconName: "smartphone", accountId: bca.id, categoryId: categories["Top Up E-wallet"].id, defaultAmount: 20000 },
    { label: "Minimarket", iconName: "shopping-bag", accountId: cash.id, categoryId: categories["Minimarket"].id, defaultAmount: null },
  ];

  for (const shortcut of shortcutsData) {
    const existing = await prisma.quickShortcut.findFirst({
      where: { label: shortcut.label },
    });
    if (!existing) {
      await prisma.quickShortcut.create({
        data: { ...shortcut, emoji: "", iconName: shortcut.iconName || DEFAULT_SHORTCUT_ICON },
      });
    } else {
      await prisma.quickShortcut.update({
        where: { id: existing.id },
        data: { iconName: shortcut.iconName, emoji: "" },
      });
    }
  }

  console.log("Seed completed: 3 accounts, 14 categories, 5 shortcuts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
