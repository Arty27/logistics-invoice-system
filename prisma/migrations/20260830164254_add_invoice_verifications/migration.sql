-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VerificationResult" AS ENUM ('MATCHED', 'DISCREPANCY');

-- CreateTable
CREATE TABLE "InvoiceVerification" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoicedQuantity" INTEGER NOT NULL,
    "dispatchedQuantity" INTEGER NOT NULL,
    "invoicedWeight" DECIMAL(12,2) NOT NULL,
    "dispatchedWeight" DECIMAL(12,2) NOT NULL,
    "remarks" TEXT NOT NULL,
    "result" "VerificationResult" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "supervisorId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceVerification_supervisorId_idx" ON "InvoiceVerification"("supervisorId");

-- CreateIndex
CREATE INDEX "InvoiceVerification_companyId_idx" ON "InvoiceVerification"("companyId");

-- CreateIndex
CREATE INDEX "InvoiceVerification_invoiceNumber_idx" ON "InvoiceVerification"("invoiceNumber");

-- CreateIndex
CREATE INDEX "InvoiceVerification_status_idx" ON "InvoiceVerification"("status");

-- CreateIndex
CREATE INDEX "InvoiceVerification_result_idx" ON "InvoiceVerification"("result");

-- CreateIndex
CREATE INDEX "InvoiceVerification_startedAt_idx" ON "InvoiceVerification"("startedAt");

-- CreateIndex
CREATE INDEX "InvoiceVerification_completedAt_idx" ON "InvoiceVerification"("completedAt");

-- CreateIndex
CREATE INDEX "InvoiceVerification_companyId_status_idx" ON "InvoiceVerification"("companyId", "status");

-- CreateIndex
CREATE INDEX "InvoiceVerification_companyId_invoiceNumber_idx" ON "InvoiceVerification"("companyId", "invoiceNumber");

-- AddForeignKey
ALTER TABLE "InvoiceVerification" ADD CONSTRAINT "InvoiceVerification_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerification" ADD CONSTRAINT "InvoiceVerification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
