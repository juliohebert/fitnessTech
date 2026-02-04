/*
  Warnings:

  - You are about to drop the column `quantidade` on the `registros_acesso` table. All the data in the column will be lost.
  - Added the required column `nomeAluno` to the `registros_acesso` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "registros_acesso" DROP COLUMN "quantidade",
ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nomeAluno" TEXT NOT NULL;
