/*
  Warnings:

  - You are about to drop the column `comparePrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `costPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `featured` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `seoDescription` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `seoKeywords` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `seoTitle` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `variant` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_productId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "comparePrice",
DROP COLUMN "costPrice",
DROP COLUMN "featured",
DROP COLUMN "seoDescription",
DROP COLUMN "seoKeywords",
DROP COLUMN "seoTitle",
DROP COLUMN "shortDescription",
ALTER COLUMN "minStock" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "createdAt",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
DROP COLUMN "value",
ADD COLUMN     "variant" TEXT NOT NULL;

-- DropTable
DROP TABLE "Review";

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
