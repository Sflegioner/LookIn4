-- CreateEnum
CREATE TYPE "OffreType" AS ENUM ('EMPLOI', 'SERVICE', 'PARTENARIAT', 'APPEL_OFFRE');

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_companyId_fkey";

-- DropTable
DROP TABLE "Job";

-- CreateTable
CREATE TABLE "Offre" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "OffreType" NOT NULL DEFAULT 'EMPLOI',
    "metier" TEXT,
    "region" TEXT,
    "contract" "ContractType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Offre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offre_type_idx" ON "Offre"("type");

-- CreateIndex
CREATE INDEX "Offre_metier_idx" ON "Offre"("metier");

-- CreateIndex
CREATE INDEX "Offre_region_idx" ON "Offre"("region");

-- CreateIndex
CREATE INDEX "Offre_contract_idx" ON "Offre"("contract");

-- CreateIndex
CREATE INDEX "Offre_companyId_idx" ON "Offre"("companyId");

-- AddForeignKey
ALTER TABLE "Offre" ADD CONSTRAINT "Offre_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

