/*
  Warnings:

  - A unique constraint covering the columns `[upiTransactionId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN     "upiTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_upiTransactionId_key" ON "public"."transactions"("upiTransactionId");
