/**
 * Import transaksi dari Excel Money Manager export.
 * Usage: node --env-file=.env scripts/import-excel.mjs [path-to-xlsx] [--replace] [--dry-run]
 */

import { existsSync } from "fs";
import { resolve, basename } from "path";
import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Override kategori berdasarkan kata kunci di Note/Subcategory (prioritas tertinggi) */
const NOTE_KEYWORD_MAP = [
  { keywords: ["bensin", "bendin", "pertamax", "shell", "spbu", "oli"], category: "Bensin" },
  { keywords: ["listrik", "pln", "token listrik"], category: "Tagihan" },
  { keywords: ["pulsa", "kuota", "data"], category: "Top Up E-wallet" },
  { keywords: ["laundry"], category: "Lain-lain kecil" },
  { keywords: ["sampo", "sabun", "minimarket", "indomaret", "alfamart"], category: "Minimarket" },
  { keywords: ["kipas", "apparel", "baju", "celana"], category: "Belanja Retail" },
  { keywords: ["ai", "cursor", "chatgpt", "subscription", "langganan"], category: "Lain-lain kecil" },
  { keywords: ["admin", "pendidikan", "kuliah", "sekolah"], category: "Lain-lain kecil" },
  { keywords: ["keluar", "transfer", "kirim"], category: "Transfer ke Orang" },
  { keywords: ["selisih", "koreksi"], category: "Lain-lain kecil" },
  { keywords: ["wismie", "seafood", "shamrock", "gultik", "fourspace", "warung", "kopi", "makan", "nasi", "bakso"], category: "Makan & Minum" },
];

/** Mapping kategori Excel → kategori app (jika Note tidak match keyword) */
const CATEGORY_MAP = {
  "🍜 Food": "Makan & Minum",
  "🚖 Transport": "Bensin",
  "💰 Salary": "Income/Gaji",
  "💵 Petty cash": "Income/Gaji",
  "🧥 Apparel": "Belanja Retail",
  "🪑 Household": "Tagihan",
  "📙 Education": "Lain-lain kecil",
  "👬🏻 Social Life": "Hotel/Hiburan/Nonton",
  "🖼 Culture": "Hotel/Hiburan/Nonton",
};

const ACCOUNT_MAP = {
  "Bank Accounts": "BCA",
};

function excelToDate(serial) {
  const d = XLSX.SSF.parse_date_code(Number(serial));
  if (!d) throw new Error(`Invalid date serial: ${serial}`);
  return new Date(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, d.S || 0);
}

function stripEmoji(text) {
  return String(text || "")
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
    .trim();
}

function normalizeText(text) {
  return String(text || "").trim().toLowerCase();
}

function resolveCategoryName(row, isIncome) {
  if (isIncome) {
    const excelCat = String(row.Category || "");
    if (excelCat.includes("Salary") || excelCat.includes("Petty cash")) return "Income/Gaji";
    return "Income/Gaji";
  }

  const note = normalizeText(row.Note);
  const sub = normalizeText(row.Subcategory);
  const combined = `${note} ${sub}`.trim();

  for (const rule of NOTE_KEYWORD_MAP) {
    if (rule.keywords.some((kw) => combined.includes(kw) || note === kw)) {
      return rule.category;
    }
  }

  const mapped = CATEGORY_MAP[row.Category];
  if (mapped) return mapped;

  return stripEmoji(row.Category) || "Lain-lain kecil";
}

async function getCategoryByName(name, isIncome) {
  const cat = await prisma.category.findUnique({ where: { name } });
  if (cat) return cat;

  return prisma.category.create({
    data: {
      name,
      emoji: "",
      iconName: isIncome ? "banknote" : "circle-dollar-sign",
      type: isIncome ? "INCOME" : "LIFESTYLE",
    },
  });
}

async function resolveAccount(excelAccount) {
  const name = ACCOUNT_MAP[excelAccount] || excelAccount || "BCA";
  let account = await prisma.account.findUnique({ where: { name } });
  if (!account) {
    account = await prisma.account.create({
      data: { name, colorTag: "#0055A4", currentBalance: 0 },
    });
  }
  return account;
}

async function recalcBalances() {
  const accounts = await prisma.account.findMany();
  for (const account of accounts) {
    const txs = await prisma.transaction.findMany({ where: { accountId: account.id } });
    let balance = 0;
    for (const t of txs) {
      if (t.type === "CREDIT" || t.type === "TRANSFER_IN") balance += t.amount;
      else if (t.type === "DEBIT" || t.type === "TRANSFER_OUT") balance -= t.amount;
    }
    await prisma.account.update({
      where: { id: account.id },
      data: { currentBalance: balance },
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const replace = args.includes("--replace");
  const dryRun = args.includes("--dry-run");
  const fileArg = args.find((a) => !a.startsWith("--"));
  const filePath = resolve(fileArg || "2026-01-01 ~ 12-31 (1).xlsx");

  if (!existsSync(filePath)) {
    console.error(`File tidak ditemukan: ${filePath}`);
    process.exit(1);
  }

  console.log(`Importing: ${basename(filePath)}${dryRun ? " (DRY RUN)" : ""}`);

  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) {
    console.error("Sheet kosong");
    process.exit(1);
  }

  const account = await resolveAccount(rows[0].Accounts);

  if (replace && !dryRun) {
    const deleted = await prisma.transaction.deleteMany({ where: { accountId: account.id } });
    console.log(`Hapus ${deleted.count} transaksi lama di akun ${account.name}`);
  }

  let imported = 0;
  let skipped = 0;
  const errors = [];
  const mappingStats = {};

  for (const row of rows) {
    try {
      const amount = Number(row.Amount || row.IDR);
      if (!amount || amount <= 0) {
        skipped++;
        continue;
      }

      const ieType = String(row["Income/Expense"] || "");
      const isIncome = ieType.toLowerCase().includes("income");
      const type = isIncome ? "CREDIT" : "DEBIT";

      const categoryName = resolveCategoryName(row, isIncome);
      const category = await getCategoryByName(categoryName, isIncome);
      const date = excelToDate(row.Period);

      const note = String(row.Note || "").trim();
      const sub = String(row.Subcategory || "").trim();
      const description = note || sub || stripEmoji(row.Category) || category.name;

      const mapKey = `${row.Category}${note ? ` [${note}]` : ""} → ${categoryName}`;
      mappingStats[mapKey] = (mappingStats[mapKey] || 0) + 1;

      if (!dryRun) {
        await prisma.transaction.create({
          data: {
            accountId: account.id,
            categoryId: category.id,
            amount,
            type,
            description,
            date,
          },
        });
      }
      imported++;
    } catch (err) {
      errors.push({ row, error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (!dryRun) await recalcBalances();

  const accountAfter = dryRun
    ? account
    : await prisma.account.findUnique({ where: { id: account.id } });

  console.log("\n=== Mapping kategori ===");
  Object.entries(mappingStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${v}x  ${k}`));

  console.log("\n=== Import selesai ===");
  console.log(`Berhasil : ${imported}`);
  console.log(`Dilewati : ${skipped}`);
  console.log(`Error    : ${errors.length}`);
  if (!dryRun) {
    console.log(`Akun     : ${accountAfter?.name}`);
    console.log(`Saldo    : Rp${Math.round(accountAfter?.currentBalance || 0).toLocaleString("id-ID")}`);
  }

  if (errors.length > 0) {
    console.log("\nError detail (max 5):");
    errors.slice(0, 5).forEach((e) => console.log("-", e.error, e.row));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
