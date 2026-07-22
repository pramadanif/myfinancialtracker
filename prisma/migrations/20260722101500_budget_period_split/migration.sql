-- AlterTable: Category budget period split
ALTER TABLE "Category" ADD COLUMN "budgetPeriod" TEXT NOT NULL DEFAULT 'WEEKLY';
ALTER TABLE "Category" ADD COLUMN "dailyBudget" REAL;

UPDATE "Category" SET "budgetPeriod" = 'MONTHLY' WHERE "type" IN ('MONTHLY_FIXED', 'LIFESTYLE');
UPDATE "Category" SET "budgetPeriod" = 'WEEKLY' WHERE "type" = 'DAILY_RECURRING';

-- AlterTable: Remove shortcut frequency (wrong feature)
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_QuickShortcut" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "defaultAmount" REAL,
    "emoji" TEXT NOT NULL DEFAULT '',
    "iconName" TEXT NOT NULL DEFAULT 'zap',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuickShortcut_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuickShortcut_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_QuickShortcut" ("id", "label", "accountId", "categoryId", "defaultAmount", "emoji", "iconName", "usageCount", "createdAt")
SELECT "id", "label", "accountId", "categoryId", "defaultAmount", "emoji", "iconName", "usageCount", "createdAt" FROM "QuickShortcut";

DROP TABLE "QuickShortcut";
ALTER TABLE "new_QuickShortcut" RENAME TO "QuickShortcut";
CREATE INDEX "QuickShortcut_usageCount_idx" ON "QuickShortcut"("usageCount");

PRAGMA foreign_keys=ON;
