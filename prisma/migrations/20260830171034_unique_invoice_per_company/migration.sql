/*
  Warnings:

  - A unique constraint covering the columns `[companyId,invoiceNumber]` on the table `InvoiceVerification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "InvoiceVerification_companyId_invoiceNumber_key" ON "InvoiceVerification"("companyId", "invoiceNumber");
