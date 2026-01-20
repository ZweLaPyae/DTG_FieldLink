-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_serviceTypeId_fkey";

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "serviceTypeId" DROP NOT NULL,
ALTER COLUMN "splitter" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
