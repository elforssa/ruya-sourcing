/*
  Warnings:

  - You are about to drop the column `supplierName` on the `Quotation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "estimatedDelivery" TIMESTAMP(3),
ADD COLUMN     "invoiceUrl" TEXT,
ADD COLUMN     "paymentConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "paymentReceiptUrl" TEXT,
ADD COLUMN     "paymentRejectedReason" TEXT,
ADD COLUMN     "paymentSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "shippingMarkCartons" INTEGER,
ADD COLUMN     "shippingMarkDimensions" TEXT,
ADD COLUMN     "shippingMarkGrossWeight" TEXT,
ADD COLUMN     "shippingMarkNetWeight" TEXT,
ADD COLUMN     "shippingMarkNotes" TEXT,
ADD COLUMN     "shippingMarkRef" TEXT,
ADD COLUMN     "shippingMarkSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "supplierName",
ADD COLUMN     "revisionNote" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedReason" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleChangeLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT,
    "changedById" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "fromRole" TEXT NOT NULL,
    "toRole" TEXT NOT NULL,

    CONSTRAINT "RoleChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
