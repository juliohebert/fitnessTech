-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "instrutorId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "hora" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agendamentos_instrutorId_idx" ON "agendamentos"("instrutorId");

-- CreateIndex
CREATE INDEX "agendamentos_alunoId_idx" ON "agendamentos"("alunoId");

-- CreateIndex
CREATE INDEX "agendamentos_data_idx" ON "agendamentos"("data");

-- CreateIndex
CREATE INDEX "agendamentos_status_idx" ON "agendamentos"("status");
