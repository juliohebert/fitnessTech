-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "criterio" TEXT NOT NULL,
    "valor" DOUBLE PRECISION,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges_conquistados" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "progresso" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conquistado" BOOLEAN NOT NULL DEFAULT false,
    "conquistadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_conquistados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequencias" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "atual" INTEGER NOT NULL DEFAULT 0,
    "melhor" INTEGER NOT NULL DEFAULT 0,
    "ultimaData" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sequencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "badges_tipo_idx" ON "badges"("tipo");

-- CreateIndex
CREATE INDEX "badges_conquistados_usuarioId_idx" ON "badges_conquistados"("usuarioId");

-- CreateIndex
CREATE INDEX "badges_conquistados_conquistado_idx" ON "badges_conquistados"("conquistado");

-- CreateIndex
CREATE UNIQUE INDEX "badges_conquistados_usuarioId_badgeId_key" ON "badges_conquistados"("usuarioId", "badgeId");

-- CreateIndex
CREATE INDEX "sequencias_usuarioId_idx" ON "sequencias"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "sequencias_usuarioId_tipo_key" ON "sequencias"("usuarioId", "tipo");

-- AddForeignKey
ALTER TABLE "badges_conquistados" ADD CONSTRAINT "badges_conquistados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges_conquistados" ADD CONSTRAINT "badges_conquistados_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sequencias" ADD CONSTRAINT "sequencias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
