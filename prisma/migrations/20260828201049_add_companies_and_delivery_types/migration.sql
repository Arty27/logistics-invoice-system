-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('INWARD', 'OUTWARD', 'MATERIAL_RETURN', 'OTHER');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPERVISOR';

-- DropIndex
DROP INDEX "PacklistEntry_packlistNumber_key";

-- AlterTable
ALTER TABLE "PacklistEntry" ADD COLUMN     "calculationVersion" INTEGER,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "deliveryType" "DeliveryType",
ADD COLUMN     "perPersonWeight" DECIMAL(12,2),
ADD COLUMN     "referenceNumber" TEXT,
ALTER COLUMN "packlistNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RstEntry" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_isActive_idx" ON "Company"("isActive");

-- CreateIndex
CREATE INDEX "PacklistEntry_companyId_idx" ON "PacklistEntry"("companyId");

-- CreateIndex
CREATE INDEX "PacklistEntry_companyId_status_idx" ON "PacklistEntry"("companyId", "status");

-- CreateIndex
CREATE INDEX "PacklistEntry_referenceNumber_idx" ON "PacklistEntry"("referenceNumber");

-- CreateIndex
CREATE INDEX "PacklistEntry_companyId_referenceNumber_idx" ON "PacklistEntry"("companyId", "referenceNumber");

-- CreateIndex
CREATE INDEX "PacklistEntry_packlistNumber_idx" ON "PacklistEntry"("packlistNumber");

-- CreateIndex
CREATE INDEX "PacklistPicker_pickerId_packlistId_idx" ON "PacklistPicker"("pickerId", "packlistId");

-- CreateIndex
CREATE INDEX "RstEntry_companyId_idx" ON "RstEntry"("companyId");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacklistEntry" ADD CONSTRAINT "PacklistEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RstEntry" ADD CONSTRAINT "RstEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
