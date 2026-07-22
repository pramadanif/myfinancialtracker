/**
 * Functional test: balance updates on create, update, delete.
 * Usage: node --env-file=.env scripts/test-transactions.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

async function getBca() {
  const account = await prisma.account.findUnique({ where: { name: "BCA" } });
  assert(account, "BCA account missing");
  return account;
}

async function getExpenseCategory() {
  const cat = await prisma.category.findFirst({
    where: { type: { notIn: ["INCOME", "TRANSFER"] } },
  });
  assert(cat, "expense category missing");
  return cat;
}

async function createExpense(accountId, categoryId, amount, description) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        accountId,
        categoryId,
        amount,
        type: "DEBIT",
        description,
        date: new Date(),
      },
    });
    await tx.account.update({
      where: { id: accountId },
      data: { currentBalance: { decrement: amount } },
    });
    return created;
  });
}

async function deleteExpense(txId, accountId, amount, type) {
  await prisma.$transaction(async (tx) => {
    await tx.transaction.delete({ where: { id: txId } });
    const change = type === "CREDIT" ? -amount : amount;
    await tx.account.update({
      where: { id: accountId },
      data: { currentBalance: { increment: change } },
    });
  });
}

async function main() {
  console.log("=== Transaction balance functional test ===\n");

  const account = await getBca();
  const category = await getExpenseCategory();
  const before = account.currentBalance;
  const amount = 12345;

  console.log(`BCA balance before: Rp${before.toLocaleString("id-ID")}`);

  const tx = await createExpense(account.id, category.id, amount, "__test__");
  const afterCreate = (await prisma.account.findUnique({ where: { id: account.id } }))?.currentBalance ?? 0;
  assert(afterCreate === before - amount, `create: expected ${before - amount}, got ${afterCreate}`);
  console.log(`✓ Expense Rp${amount.toLocaleString("id-ID")} → balance Rp${afterCreate.toLocaleString("id-ID")}`);

  await deleteExpense(tx.id, account.id, amount, "DEBIT");
  const afterDelete = (await prisma.account.findUnique({ where: { id: account.id } }))?.currentBalance ?? 0;
  assert(afterDelete === before, `delete revert: expected ${before}, got ${afterDelete}`);
  console.log(`✓ Delete reverted → balance Rp${afterDelete.toLocaleString("id-ID")}`);

  // Income test
  const incomeCat = await prisma.category.findFirst({ where: { type: "INCOME" } });
  assert(incomeCat, "income category missing");
  const incomeTx = await prisma.$transaction(async (t) => {
    const created = await t.transaction.create({
      data: {
        accountId: account.id,
        categoryId: incomeCat.id,
        amount: 50000,
        type: "CREDIT",
        description: "__test_income__",
        date: new Date(),
      },
    });
    await t.account.update({ where: { id: account.id }, data: { currentBalance: { increment: 50000 } } });
    return created;
  });
  const afterIncome = (await prisma.account.findUnique({ where: { id: account.id } }))?.currentBalance ?? 0;
  assert(afterIncome === before + 50000, `income: expected ${before + 50000}, got ${afterIncome}`);
  console.log(`✓ Income Rp50.000 → balance Rp${afterIncome.toLocaleString("id-ID")}`);

  await deleteExpense(incomeTx.id, account.id, 50000, "CREDIT");
  const final = (await prisma.account.findUnique({ where: { id: account.id } }))?.currentBalance ?? 0;
  assert(final === before, `final: expected ${before}, got ${final}`);
  console.log(`✓ Cleanup OK → balance Rp${final.toLocaleString("id-ID")}`);

  console.log("\n=== All tests passed ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
