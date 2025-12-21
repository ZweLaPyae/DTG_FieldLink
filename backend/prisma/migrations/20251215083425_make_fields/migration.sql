-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_rootCauseId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "rootCauseId" DROP NOT NULL,
ALTER COLUMN "materialsUsed" DROP NOT NULL,
ALTER COLUMN "attachments" DROP NOT NULL,
ALTER COLUMN "updates" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_rootCauseId_fkey" FOREIGN KEY ("rootCauseId") REFERENCES "RootCause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
