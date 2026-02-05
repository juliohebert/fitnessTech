-- CreateTable
CREATE TABLE "atividades_cardio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "origem" TEXT NOT NULL DEFAULT 'MANUAL',
    "duracao" INTEGER NOT NULL,
    "distancia" DOUBLE PRECISION,
    "calorias" INTEGER,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "ritmo" DOUBLE PRECISION,
    "velocidade" DOUBLE PRECISION,
    "passos" INTEGER,
    "cadencia" INTEGER,
    "fcMedia" INTEGER,
    "fcMaxima" INTEGER,
    "fcMinima" INTEGER,
    "zonaFC" TEXT,
    "elevacaoGanha" DOUBLE PRECISION,
    "elevacaoPerdida" DOUBLE PRECISION,
    "rotaGPS" JSONB,
    "mapaSnapshot" TEXT,
    "stravaId" TEXT,
    "appleHealthId" TEXT,
    "googleFitId" TEXT,
    "sensacao" INTEGER,
    "clima" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atividades_cardio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integracoes_externas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpira" TIMESTAMP(3),
    "sincronizarAuto" BOOLEAN NOT NULL DEFAULT true,
    "ultimaSync" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integracoes_externas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "atividades_cardio_usuarioId_idx" ON "atividades_cardio"("usuarioId");

-- CreateIndex
CREATE INDEX "atividades_cardio_tipo_idx" ON "atividades_cardio"("tipo");

-- CreateIndex
CREATE INDEX "atividades_cardio_origem_idx" ON "atividades_cardio"("origem");

-- CreateIndex
CREATE INDEX "atividades_cardio_dataInicio_idx" ON "atividades_cardio"("dataInicio");

-- CreateIndex
CREATE INDEX "atividades_cardio_stravaId_idx" ON "atividades_cardio"("stravaId");

-- CreateIndex
CREATE INDEX "integracoes_externas_usuarioId_idx" ON "integracoes_externas"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "integracoes_externas_usuarioId_plataforma_key" ON "integracoes_externas"("usuarioId", "plataforma");

-- AddForeignKey
ALTER TABLE "atividades_cardio" ADD CONSTRAINT "atividades_cardio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integracoes_externas" ADD CONSTRAINT "integracoes_externas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
