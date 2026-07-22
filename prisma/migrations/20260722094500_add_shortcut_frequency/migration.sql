-- AlterTable
ALTER TABLE "QuickShortcut" ADD COLUMN "frequency" TEXT NOT NULL DEFAULT 'DAILY';

-- CreateIndex
CREATE INDEX "QuickShortcut_frequency_idx" ON "QuickShortcut"("frequency");

-- Classify existing seed shortcuts
UPDATE "QuickShortcut" SET "frequency" = 'WEEKLY' WHERE "label" IN ('Isi Bensin', 'Top Up ShopeePay');
