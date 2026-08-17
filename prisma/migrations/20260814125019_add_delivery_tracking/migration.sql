-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'LEGACY');

-- AlterTable
ALTER TABLE "PacklistEntry" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" "DeliveryStatus" NOT NULL DEFAULT 'LEGACY';

-- CreateTable
CREATE TABLE "PacklistPicker" (
    "id" TEXT NOT NULL,
    "packlistId" TEXT NOT NULL,
    "pickerId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PacklistPicker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PacklistPicker_pickerId_idx" ON "PacklistPicker"("pickerId");

-- CreateIndex
CREATE UNIQUE INDEX "PacklistPicker_packlistId_pickerId_key" ON "PacklistPicker"("packlistId", "pickerId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "PacklistEntry_createdById_idx" ON "PacklistEntry"("createdById");

-- CreateIndex
CREATE INDEX "PacklistEntry_status_idx" ON "PacklistEntry"("status");

-- AddForeignKey
ALTER TABLE "PacklistEntry" ADD CONSTRAINT "PacklistEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacklistPicker" ADD CONSTRAINT "PacklistPicker_packlistId_fkey" FOREIGN KEY ("packlistId") REFERENCES "PacklistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacklistPicker" ADD CONSTRAINT "PacklistPicker_pickerId_fkey" FOREIGN KEY ("pickerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
