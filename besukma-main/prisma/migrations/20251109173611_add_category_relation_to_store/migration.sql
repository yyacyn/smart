/*
  Warnings:

  - You are about to drop the column `establishedDate` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `statusReason` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `registeredAt` on the `User` table. All the data in the column will be lost.
  - Made the column `categoryId` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "establishedDate",
DROP COLUMN "statusReason",
DROP COLUMN "website",
ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "registeredAt";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
