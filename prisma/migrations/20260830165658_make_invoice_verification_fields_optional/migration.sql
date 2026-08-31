-- AlterTable
ALTER TABLE "InvoiceVerification" ALTER COLUMN "dispatchedQuantity" DROP NOT NULL,
ALTER COLUMN "dispatchedWeight" DROP NOT NULL,
ALTER COLUMN "remarks" DROP NOT NULL,
ALTER COLUMN "result" DROP NOT NULL;
