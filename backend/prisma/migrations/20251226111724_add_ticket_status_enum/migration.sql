/*
  Warnings:

  - The `status` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED');

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "status",
ADD COLUMN     "status" "TicketStatus" NOT NULL DEFAULT 'NEW';
