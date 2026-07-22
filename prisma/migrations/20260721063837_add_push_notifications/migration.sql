-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "dailyReminder" BOOLEAN NOT NULL DEFAULT true,
    "dailyReminderHour" INTEGER NOT NULL DEFAULT 20,
    "budgetAlert" BOOLEAN NOT NULL DEFAULT true,
    "weeklySummary" BOOLEAN NOT NULL DEFAULT true,
    "weeklySummaryDay" INTEGER NOT NULL DEFAULT 1,
    "weeklySummaryHour" INTEGER NOT NULL DEFAULT 9,
    "lastDailySent" DATETIME,
    "lastWeeklySent" DATETIME,
    "lastBudgetAlerts" TEXT NOT NULL DEFAULT '{}'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
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
INSERT INTO "new_QuickShortcut" ("accountId", "categoryId", "createdAt", "defaultAmount", "emoji", "iconName", "id", "label", "usageCount") SELECT "accountId", "categoryId", "createdAt", "defaultAmount", "emoji", "iconName", "id", "label", "usageCount" FROM "QuickShortcut";
DROP TABLE "QuickShortcut";
ALTER TABLE "new_QuickShortcut" RENAME TO "QuickShortcut";
CREATE INDEX "QuickShortcut_usageCount_idx" ON "QuickShortcut"("usageCount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
