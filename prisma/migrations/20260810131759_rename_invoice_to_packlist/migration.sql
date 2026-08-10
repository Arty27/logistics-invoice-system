/*
  Warnings:

  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_pickerId_fkey";

-- DropTable
DROP TABLE "Invoice";

-- CreateTable
CREATE TABLE "PacklistEntry" (
    "id" TEXT NOT NULL,
    "packlistNumber" TEXT NOT NULL,
    "invoiceQuantity" INTEGER NOT NULL,
    "grossWeight" DECIMAL(12,2) NOT NULL,
    "pickerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PacklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PacklistEntry_packlistNumber_key" ON "PacklistEntry"("packlistNumber");

-- CreateIndex
CREATE INDEX "PacklistEntry_pickerId_idx" ON "PacklistEntry"("pickerId");

-- CreateIndex
CREATE INDEX "PacklistEntry_createdAt_idx" ON "PacklistEntry"("createdAt");

-- AddForeignKey
ALTER TABLE "PacklistEntry" ADD CONSTRAINT "PacklistEntry_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
