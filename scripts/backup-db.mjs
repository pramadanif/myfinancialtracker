/**
 * Backup semua tabel ke JSON — tidak butuh pg_dump (aman beda versi Postgres).
 * Pakai: npm run db:backup
 */
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backupDir = join(__dirname, "..", "backups");
const prisma = new PrismaClient();

const MODELS = [
  "account",
  "category",
  "transaction",
  "quickShortcut",
  "budgetTarget",
  "appSettings",
  "pushSubscription",
  "notificationPreference",
];

async function main() {
  await mkdir(backupDir, { recursive: true });

  const data = {};
  for (const model of MODELS) {
    data[model] = await prisma[model].findMany();
    console.log(`${model}: ${data[model].length} rows`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = join(backupDir, `backup-${stamp}.json`);
  await writeFile(file, JSON.stringify({ createdAt: new Date().toISOString(), data }, null, 2));
  console.log(`Backup saved: ${file}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
