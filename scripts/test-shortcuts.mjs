/**
 * Functional test: shortcut CRUD.
 * Usage: node --env-file=.env scripts/test-shortcuts.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TEST_LABEL = "__test_shortcut__";

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

async function main() {
  console.log("=== Shortcut CRUD functional test ===\n");

  const account = await prisma.account.findFirst();
  const category = await prisma.category.findFirst({
    where: { type: { notIn: ["INCOME", "TRANSFER"] } },
  });
  assert(account, "account missing");
  assert(category, "expense category missing");

  await prisma.quickShortcut.deleteMany({ where: { label: TEST_LABEL } });

  const created = await prisma.quickShortcut.create({
    data: {
      label: TEST_LABEL,
      accountId: account.id,
      categoryId: category.id,
      defaultAmount: 42000,
      emoji: "",
      iconName: "zap",
    },
  });
  assert(created.id, "create failed");
  console.log(`✓ Created shortcut "${TEST_LABEL}"`);

  const updated = await prisma.quickShortcut.update({
    where: { id: created.id },
    data: { defaultAmount: 84000, label: `${TEST_LABEL}_edited` },
  });
  assert(updated.defaultAmount === 84000, "update amount failed");
  assert(updated.label === `${TEST_LABEL}_edited`, "update label failed");
  console.log("✓ Updated shortcut");

  const found = await prisma.quickShortcut.findUnique({ where: { id: created.id } });
  assert(found?.defaultAmount === 84000, "read after update failed");
  console.log("✓ Read after update");

  await prisma.quickShortcut.delete({ where: { id: created.id } });
  const gone = await prisma.quickShortcut.findUnique({ where: { id: created.id } });
  assert(!gone, "delete failed");
  console.log("✓ Deleted shortcut");

  console.log("\nAll shortcut tests passed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
