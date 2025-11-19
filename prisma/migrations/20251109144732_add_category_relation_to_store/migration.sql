-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "establishedDate" TIMESTAMP(3),
ADD COLUMN     "statusReason" TEXT,
ADD COLUMN     "website" TEXT;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
