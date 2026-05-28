/*
  Warnings:

  - You are about to drop the column `shippingAddress` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "shippingAddress",
ADD COLUMN     "carrier" TEXT NOT NULL DEFAULT 'postnord',
ADD COLUMN     "labelUrl" TEXT,
ADD COLUMN     "shippingAddress1" TEXT,
ADD COLUMN     "shippingAddress2" TEXT,
ADD COLUMN     "shippingCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingPhone" TEXT,
ADD COLUMN     "subtotalCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trackingNumber" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'dkk';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "weightGrams" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "weightGrams" INTEGER NOT NULL DEFAULT 50,
ALTER COLUMN "currency" SET DEFAULT 'dkk';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'DK',
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT;
