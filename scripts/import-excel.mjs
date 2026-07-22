/**
 * Import transaksi dari Excel Money Manager export.
 * Usage: node --env-file=.env scripts/import-excel.mjs [path-to-xlsx] [--replace]
 */

import { readFileSync, existsSync } from "fs";
import { resolve, basename } from "path";
import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORY_MAP = {
  "🍜 Food": "Makan & Minum",
  "👬🏻 Social Life": "Hotel/Hiburan/Nonton",
  "🖼 Culture": "Hotel/Hiburan/Nonton",
  "🚖 Transport": "Bensin",
  "💰 Salary": "Income/Gaji",
  "🧥 Apparel": "Belanja Retail",
  "🪑 Household": "Tagihan",
  "📙 Education": "Lain-lain kecil",
  "💵 Petty cash": "Income/Gaji",
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

async function resolveCategory(excelCategory, isIncome) {
  const mappedName = CATEGORY_MAP[excelCategory];
  if (mappedName) {
    const cat = await prisma.category.findUnique({ where: { name: mappedName } });
    if (cat) return cat;
  }

  const cleanName = stripEmoji(excelCategory) || (isIncome ? "Income/Gaji" : "Lain-lain kecil");
  let cat = await prisma.category.findFirst({
    where: { name: { contains: cleanName.slice(0, 20) } },
  });
  if (cat) return cat;

  return prisma.category.create({
    data: {
      name: cleanName,
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
  const fileArg = args.find((a) => !a.startsWith("--"));
  const filePath = resolve(fileArg || "2026-01-01 ~ 12-31 (1).xlsx");

  if (!existsSync(filePath)) {
    console.error(`File tidak ditemukan: ${filePath}`);
    process.exit(1);
  }

  console.log(`Importing: ${basename(filePath)}`);

  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) {
    console.error("Sheet kosong");
    process.exit(1);
  }

  const account = await resolveAccount(rows[0].Accounts);

  if (replace) {
    const deleted = await prisma.transaction.deleteMany({ where: { accountId: account.id } });
    console.log(`Hapus ${deleted.count} transaksi lama di akun ${account.name}`);
  }

  let imported = 0;
  let skipped = 0;
  const errors = [];

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

      const category = await resolveCategory(row.Category, isIncome);
      const date = excelToDate(row.Period);

      const note = String(row.Note || "").trim();
      const sub = String(row.Subcategory || "").trim();
      const description = note || sub || stripEmoji(row.Category) || category.name;

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
      imported++;
    } catch (err) {
      errors.push({ row, error: err instanceof Error ? err.message : String(err) });
    }
  }

  await recalcBalances();

  const accountAfter = await prisma.account.findUnique({ where: { id: account.id } });

  console.log("\n=== Import selesai ===");
  console.log(`Berhasil : ${imported}`);
  console.log(`Dilewati : ${skipped}`);
  console.log(`Error    : ${errors.length}`);
  console.log(`Akun     : ${accountAfter?.name}`);
  console.log(`Saldo    : Rp${Math.round(accountAfter?.currentBalance || 0).toLocaleString("id-ID")}`);

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
