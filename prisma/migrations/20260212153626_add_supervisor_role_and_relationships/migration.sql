/*
  Warnings:

  - The values [MANAGER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `businessName` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Client` table. All the data in the column will be lost.
  - The `businessType` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `deviceInfo` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `accuracy` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `afterPhotos` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `beforePhotos` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `isSynced` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `purpose` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledDate` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `signedAt` on the `Visit` table. All the data in the column will be lost.
  - The `status` column on the `Visit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `promoterId` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'PROMOTER', 'VIEWER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PROMOTER';
COMMIT;

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_promoterId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_promoterId_fkey";

-- DropIndex
DROP INDEX "Client_businessName_idx";

-- DropIndex
DROP INDEX "Client_businessType_idx";

-- DropIndex
DROP INDEX "Client_createdAt_idx";

-- DropIndex
DROP INDEX "Client_isActive_idx";

-- DropIndex
DROP INDEX "Client_name_idx";

-- DropIndex
DROP INDEX "RefreshToken_expiresAt_idx";

-- DropIndex
DROP INDEX "Visit_createdAt_idx";

-- DropIndex
DROP INDEX "Visit_isSynced_idx";

-- DropIndex
DROP INDEX "Visit_purpose_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "businessName",
DROP COLUMN "category",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "isActive",
DROP COLUMN "postalCode",
DROP COLUMN "state",
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
DROP COLUMN "businessType",
ADD COLUMN     "businessType" TEXT,
ALTER COLUMN "promoterId" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "deviceInfo",
DROP COLUMN "revokedAt",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastLoginAt",
ADD COLUMN     "supervisorId" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "accuracy",
DROP COLUMN "afterPhotos",
DROP COLUMN "beforePhotos",
DROP COLUMN "duration",
DROP COLUMN "isSynced",
DROP COLUMN "purpose",
DROP COLUMN "rating",
DROP COLUMN "scheduledDate",
DROP COLUMN "signedAt",
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(6),
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'COMPLETED',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- DropEnum
DROP TYPE "BusinessType";

-- DropEnum
DROP TYPE "VisitPurpose";

-- DropEnum
DROP TYPE "VisitStatus";

-- CreateIndex
CREATE INDEX "User_supervisor_idx" ON "User"("supervisorId");

-- CreateIndex
-- CREATE INDEX "idx_visit_status" ON "Visit"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- RenameIndex
ALTER INDEX "Client_promoterId_idx" RENAME TO "Client_promoter_idx";

-- RenameIndex
ALTER INDEX "RefreshToken_token_idx" RENAME TO "idx_refresh_token_token";

-- RenameIndex
ALTER INDEX "RefreshToken_userId_idx" RENAME TO "idx_refresh_token_user_id";

-- RenameIndex
ALTER INDEX "User_email_idx" RENAME TO "idx_user_email";

-- RenameIndex
ALTER INDEX "Visit_clientId_idx" RENAME TO "idx_visit_client_id";

-- RenameIndex
ALTER INDEX "Visit_date_idx" RENAME TO "idx_visit_date";

-- RenameIndex
ALTER INDEX "Visit_promoterId_idx" RENAME TO "idx_visit_promoter_id";

-- RenameIndex
-- ALTER INDEX "Visit_status_idx" RENAME TO "idx_visit_status";
