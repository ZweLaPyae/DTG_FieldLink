/*
  Warnings:

  - You are about to drop the column `createdAt` on the `MaterialCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `MaterialCatalog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MaterialCatalog" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
