-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_technicianId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ALTER COLUMN "technicianId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;
