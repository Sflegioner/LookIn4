-- DropIndex
DROP INDEX "Cv_userId_idx";

-- AlterTable
ALTER TABLE "Offre" ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Cv_userId_key" ON "Cv"("userId");

