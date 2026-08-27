/*
  Warnings:

  - The `package` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Package" AS ENUM ('free', 'premium', 'elite');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "package",
ADD COLUMN     "package" "Package" NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "package" "Package" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'pending',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_razorpayOrderId_key" ON "Subscription"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_razorpayPaymentId_key" ON "Subscription"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
