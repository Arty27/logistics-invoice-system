/*
  Warnings:

  - Made the column `companyId` on table `PacklistEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `deliveryType` on table `PacklistEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `referenceNumber` on table `PacklistEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `RstEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PacklistEntry" DROP CONSTRAINT "PacklistEntry_companyId_fkey";

-- DropForeignKey
ALTER TABLE "RstEntry" DROP CONSTRAINT "RstEntry_companyId_fkey";

-- AlterTable
ALTER TABLE "PacklistEntry" ALTER COLUMN "companyId" SET NOT NULL,
ALTER COLUMN "deliveryType" SET NOT NULL,
ALTER COLUMN "referenceNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "RstEntry" ALTER COLUMN "companyId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "PacklistEntry" ADD CONSTRAINT "PacklistEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RstEntry" ADD CONSTRAINT "RstEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
