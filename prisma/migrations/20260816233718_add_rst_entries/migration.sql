-- CreateTable
CREATE TABLE "RstEntry" (
    "id" TEXT NOT NULL,
    "skuCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "enteredById" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RstEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RstEntry_enteredAt_idx" ON "RstEntry"("enteredAt");

-- CreateIndex
CREATE INDEX "RstEntry_skuCode_idx" ON "RstEntry"("skuCode");

-- CreateIndex
CREATE INDEX "RstEntry_enteredById_idx" ON "RstEntry"("enteredById");

-- AddForeignKey
ALTER TABLE "RstEntry" ADD CONSTRAINT "RstEntry_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
