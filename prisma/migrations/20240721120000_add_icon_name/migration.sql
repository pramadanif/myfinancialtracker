-- AlterTable: add iconName to Category
ALTER TABLE "Category" ADD COLUMN "iconName" TEXT NOT NULL DEFAULT 'circle-dollar-sign';

-- AlterTable: add iconName to QuickShortcut
ALTER TABLE "QuickShortcut" ADD COLUMN "iconName" TEXT NOT NULL DEFAULT 'zap';

-- Migrate existing Category emoji to iconName
UPDATE "Category" SET "iconName" = 'utensils-crossed' WHERE "name" = 'Makan & Minum';
UPDATE "Category" SET "iconName" = 'fuel' WHERE "name" = 'Bensin';
UPDATE "Category" SET "iconName" = 'shopping-bag' WHERE "name" = 'Minimarket';
UPDATE "Category" SET "iconName" = 'smartphone' WHERE "name" = 'Top Up E-wallet';
UPDATE "Category" SET "iconName" = 'package' WHERE "name" = 'Rokok & Oli';
UPDATE "Category" SET "iconName" = 'coins' WHERE "name" = 'Lain-lain kecil';
UPDATE "Category" SET "iconName" = 'home' WHERE "name" = 'Kos';
UPDATE "Category" SET "iconName" = 'heart-pulse' WHERE "name" = 'Kesehatan';
UPDATE "Category" SET "iconName" = 'receipt' WHERE "name" = 'Tagihan';
UPDATE "Category" SET "iconName" = 'shopping-cart' WHERE "name" = 'Belanja Retail';
UPDATE "Category" SET "iconName" = 'ticket' WHERE "name" = 'Hotel/Hiburan/Nonton';
UPDATE "Category" SET "iconName" = 'send' WHERE "name" = 'Transfer ke Orang';
UPDATE "Category" SET "iconName" = 'banknote' WHERE "name" = 'Income/Gaji';
UPDATE "Category" SET "iconName" = 'arrow-left-right' WHERE "name" = 'Transfer Antar Akun';

-- Migrate existing QuickShortcut emoji to iconName
UPDATE "QuickShortcut" SET "iconName" = 'coffee' WHERE "label" = 'Warkop/Kopi';
UPDATE "QuickShortcut" SET "iconName" = 'fuel' WHERE "label" = 'Isi Bensin';
UPDATE "QuickShortcut" SET "iconName" = 'utensils-crossed' WHERE "label" = 'Warung Makan';
UPDATE "QuickShortcut" SET "iconName" = 'smartphone' WHERE "label" = 'Top Up ShopeePay';
UPDATE "QuickShortcut" SET "iconName" = 'shopping-bag' WHERE "label" = 'Minimarket';
