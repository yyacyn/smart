/*
  Warnings:

  - You are about to drop the column `reporterEmail` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `reporterName` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `targetName` on the `Report` table. All the data in the column will be lost.
  - The `status` column on the `Report` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED', 'ESCALATED');

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "reporterEmail",
DROP COLUMN "reporterName",
DROP COLUMN "targetName",
ADD COLUMN     "reporterId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
