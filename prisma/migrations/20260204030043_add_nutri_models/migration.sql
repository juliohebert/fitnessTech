-- CreateTable
CREATE TABLE "refeicoes_diario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipoRefeicao" TEXT NOT NULL,
    "urlImagem" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feedback" TEXT,
    "avaliadoPor" TEXT,
    "avaliadoEm" TIMESTAMP(3),
    "calorias" INTEGER,
    "observacoes" TEXT,

    CONSTRAINT "refeicoes_diario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises_composicao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "percentualGordura" DOUBLE PRECISION,
    "massaMuscular" DOUBLE PRECISION,
    "aguaCorporal" DOUBLE PRECISION,
    "taxaMetabolica" DOUBLE PRECISION,
    "idadeMetabolica" INTEGER,
    "gorduraVisceral" INTEGER,
    "observacoes" TEXT,
    "avaliadoPor" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analises_composicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteudos_educacionais" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "duracao" TEXT,
    "urlConteudo" TEXT,
    "conteudo" TEXT,
    "urlImagem" TEXT,
    "publicadoPor" TEXT NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conteudos_educacionais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refeicoes_diario_usuarioId_idx" ON "refeicoes_diario"("usuarioId");

-- CreateIndex
CREATE INDEX "refeicoes_diario_data_idx" ON "refeicoes_diario"("data");

-- CreateIndex
CREATE INDEX "refeicoes_diario_status_idx" ON "refeicoes_diario"("status");

-- CreateIndex
CREATE INDEX "analises_composicao_usuarioId_idx" ON "analises_composicao"("usuarioId");

-- CreateIndex
CREATE INDEX "analises_composicao_data_idx" ON "analises_composicao"("data");

-- CreateIndex
CREATE INDEX "conteudos_educacionais_categoria_idx" ON "conteudos_educacionais"("categoria");

-- CreateIndex
CREATE INDEX "conteudos_educacionais_tipo_idx" ON "conteudos_educacionais"("tipo");

-- CreateIndex
CREATE INDEX "conteudos_educacionais_publicado_idx" ON "conteudos_educacionais"("publicado");
