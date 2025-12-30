/*
  Warnings:

  - The `phone` column on the `Customer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `materialsUsed` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `updates` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "splitterMap" TEXT,
DROP COLUMN "phone",
ADD COLUMN     "phone" TEXT[];

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "materialsUsed",
DROP COLUMN "updates",
ADD COLUMN     "faultCoordinate" JSONB;

-- CreateTable
CREATE TABLE "TicketMaterial" (
    "id" SERIAL NOT NULL,
    "ticketId" TEXT NOT NULL,
    "materialId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "TicketMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketUpdate" (
    "id" SERIAL NOT NULL,
    "ticketId" TEXT NOT NULL,
    "technicianId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketUpdate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TicketMaterial" ADD CONSTRAINT "TicketMaterial_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMaterial" ADD CONSTRAINT "TicketMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketUpdate" ADD CONSTRAINT "TicketUpdate_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketUpdate" ADD CONSTRAINT "TicketUpdate_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
