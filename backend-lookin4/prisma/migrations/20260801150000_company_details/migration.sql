-- AlterEnum
BEGIN;
CREATE TYPE "CompanySize_new" AS ENUM ('MICRO', 'SMALL', 'MEDIUM', 'ETI', 'LARGE');
ALTER TABLE "Company" ALTER COLUMN "size" TYPE "CompanySize_new" USING ("size"::text::"CompanySize_new");
ALTER TYPE "CompanySize" RENAME TO "CompanySize_old";
ALTER TYPE "CompanySize_new" RENAME TO "CompanySize";
DROP TYPE "public"."CompanySize_old";
COMMIT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "foundedOn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrgNode" ADD COLUMN     "email" TEXT,
ADD COLUMN     "telephone" TEXT;

