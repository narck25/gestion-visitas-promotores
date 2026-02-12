/*
  Warnings:

  - The `businessType` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `photos` on the `Visit` table. All the data in the column will be lost.
  - The `status` column on the `Visit` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('RETAIL', 'WHOLESALE', 'SERVICE', 'MANUFACTURING', 'FOOD', 'OTHER');

-- CreateEnum
CREATE TYPE "VisitPurpose" AS ENUM ('SALES', 'FOLLOW_UP', 'DELIVERY', 'TRAINING', 'COMPLAINT', 'OTHER');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_promoterId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_promoterId_fkey";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'México',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
ALTER COLUMN "promoterId" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "businessType",
ADD COLUMN     "businessType" "BusinessType";

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "deviceInfo" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "photos",
ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "afterPhotos" TEXT[],
ADD COLUMN     "beforePhotos" TEXT[],
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "isSynced" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "purpose" "VisitPurpose" NOT NULL DEFAULT 'SALES',
ADD COLUMN     "rating" INTEGER DEFAULT 5,
ADD COLUMN     "scheduledDate" TIMESTAMP(3),
ADD COLUMN     "signedAt" TIMESTAMP(3),
ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "VisitStatus" NOT NULL DEFAULT 'COMPLETED';

-- CreateIndex
CREATE INDEX "Client_businessName_idx" ON "Client"("businessName");

-- CreateIndex
CREATE INDEX "Client_businessType_idx" ON "Client"("businessType");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE INDEX "Client_isActive_idx" ON "Client"("isActive");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Visit_createdAt_idx" ON "Visit"("createdAt");

-- CreateIndex
CREATE INDEX "Visit_isSynced_idx" ON "Visit"("isSynced");

-- CreateIndex
CREATE INDEX "Visit_purpose_idx" ON "Visit"("purpose");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Client_promoter_idx" RENAME TO "Client_promoterId_idx";

-- RenameIndex
ALTER INDEX "idx_refresh_token_token" RENAME TO "RefreshToken_token_idx";

-- RenameIndex
ALTER INDEX "idx_refresh_token_user_id" RENAME TO "RefreshToken_userId_idx";

-- RenameIndex
ALTER INDEX "User_supervisor_idx" RENAME TO "User_supervisorId_idx";

-- RenameIndex
ALTER INDEX "idx_user_email" RENAME TO "User_email_idx";

-- RenameIndex
ALTER INDEX "idx_visit_client_id" RENAME TO "Visit_clientId_idx";

-- RenameIndex
ALTER INDEX "idx_visit_date" RENAME TO "Visit_date_idx";

-- RenameIndex
ALTER INDEX "idx_visit_promoter_id" RENAME TO "Visit_promoterId_idx";
