/*
  Warnings:

  - Added the required column `updatedAt` to the `MaterialCatalog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MaterialUnit" AS ENUM ('PIECE', 'METER');

-- AlterTable
ALTER TABLE "MaterialCatalog" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "referenceLength" DOUBLE PRECISION,
ADD COLUMN     "unit" "MaterialUnit" NOT NULL DEFAULT 'PIECE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "technicianNote" TEXT;
