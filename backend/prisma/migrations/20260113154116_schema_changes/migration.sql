/*
  Warnings:

  - You are about to drop the `BreakTime` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TicketMaterial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TicketUpdate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BreakTime" DROP CONSTRAINT "BreakTime_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "TicketMaterial" DROP CONSTRAINT "TicketMaterial_materialId_fkey";

-- DropForeignKey
ALTER TABLE "TicketMaterial" DROP CONSTRAINT "TicketMaterial_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "TicketUpdate" DROP CONSTRAINT "TicketUpdate_technicianId_fkey";

-- DropForeignKey
ALTER TABLE "TicketUpdate" DROP CONSTRAINT "TicketUpdate_ticketId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "breakTimes" JSONB,
ADD COLUMN     "materialsUsed" JSONB;

-- DropTable
DROP TABLE "BreakTime";

-- DropTable
DROP TABLE "SystemSettings";

-- DropTable
DROP TABLE "TicketMaterial";

-- DropTable
DROP TABLE "TicketUpdate";
