-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "funcao" TEXT NOT NULL DEFAULT 'ALUNO',
    "plano" TEXT NOT NULL DEFAULT 'free',
    "academiaId" TEXT,
    "telefone" TEXT,
    "cpf" TEXT,
    "imagemPerfil" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "aprovadoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculos_aluno_instrutor" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "instrutorId" TEXT NOT NULL,
    "tipoInstrutor" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vinculos_aluno_instrutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "plano" TEXT NOT NULL DEFAULT 'free',
    "maxUsuarios" INTEGER NOT NULL DEFAULT 10,
    "usuariosAtuais" INTEGER NOT NULL DEFAULT 0,
    "logo" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_treinos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tituloTreino" TEXT NOT NULL,
    "exercicios" JSONB NOT NULL,
    "duracao" INTEGER NOT NULL,
    "calorias" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,

    CONSTRAINT "historico_treinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anotacoes_treino" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tituloTreino" TEXT NOT NULL,
    "tituloExercicio" TEXT NOT NULL,
    "anotacao" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anotacoes_treino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos_exercicio" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "historicoTreinoId" TEXT,
    "tituloExercicio" TEXT NOT NULL,
    "urlVideo" TEXT NOT NULL,
    "urlThumbnail" TEXT,
    "duracao" INTEGER,
    "tamanhoArquivo" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "feedbackInstrutor" TEXT,
    "avaliadoEm" TIMESTAMP(3),
    "avaliadoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_exercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_progresso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "urlImagem" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "peso" DOUBLE PRECISION,
    "observacoes" TEXT,

    CONSTRAINT "fotos_progresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicoes_corporais" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL,
    "altura" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "gorduraCorporal" DOUBLE PRECISION,
    "massaMuscular" DOUBLE PRECISION,
    "peito" DOUBLE PRECISION,
    "cintura" DOUBLE PRECISION,
    "quadril" DOUBLE PRECISION,
    "biceps" DOUBLE PRECISION,
    "coxa" DOUBLE PRECISION,
    "panturrilha" DOUBLE PRECISION,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicoes_corporais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "valorAlvo" DOUBLE PRECISION NOT NULL,
    "valorAtual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidade" TEXT NOT NULL,
    "prazo" TIMESTAMP(3),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conquistas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "desbloqueadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conquistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desafios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "alvo" INTEGER NOT NULL,
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "recompensa" TEXT,

    CONSTRAINT "desafios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "sequencia" INTEGER NOT NULL DEFAULT 0,
    "posicao" INTEGER,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postagens" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "urlImagem" TEXT,
    "curtidas" INTEGER NOT NULL DEFAULT 0,
    "comentarios" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "totalMembros" INTEGER NOT NULL DEFAULT 0,
    "imagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_grupo" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "funcao" TEXT NOT NULL DEFAULT 'membro',
    "entradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membros_grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "previsoes_ia" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "previsao" JSONB NOT NULL,
    "confianca" DOUBLE PRECISION NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "previsoes_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises_recuperacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "horasSono" DOUBLE PRECISION,
    "nivelEstresse" INTEGER,
    "doresMuscular" INTEGER,
    "prontidao" TEXT NOT NULL,
    "recomendacoes" JSONB NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analises_recuperacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_carrinho" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nomeProduto" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "urlImagem" TEXT,
    "adicionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_carrinho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "academiaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'site',
    "status" TEXT NOT NULL DEFAULT 'lead',
    "valorEstimado" TEXT NOT NULL DEFAULT 'R$ 150/mês',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets_manutencao" (
    "id" TEXT NOT NULL,
    "academiaId" TEXT NOT NULL,
    "equipamento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "criadoPor" TEXT,
    "resolvido" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "academiaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER NOT NULL DEFAULT 10,
    "descricao" TEXT,
    "urlImagem" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas_produtos" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "academiaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DOUBLE PRECISION NOT NULL,
    "precoTotal" DOUBLE PRECISION NOT NULL,
    "dataVenda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendas_produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" TEXT NOT NULL,
    "academiaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "salario" DOUBLE PRECISION NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "dataAdmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "performance" INTEGER NOT NULL DEFAULT 85,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios_financeiros" (
    "id" TEXT NOT NULL,
    "academiaId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "receita" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "despesas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lucro" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inadimplencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relatorios_financeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_acesso" (
    "id" TEXT NOT NULL,
    "academiaId" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_acesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_academiaId_idx" ON "usuarios"("academiaId");

-- CreateIndex
CREATE INDEX "usuarios_funcao_idx" ON "usuarios"("funcao");

-- CreateIndex
CREATE INDEX "vinculos_aluno_instrutor_alunoId_idx" ON "vinculos_aluno_instrutor"("alunoId");

-- CreateIndex
CREATE INDEX "vinculos_aluno_instrutor_instrutorId_idx" ON "vinculos_aluno_instrutor"("instrutorId");

-- CreateIndex
CREATE UNIQUE INDEX "vinculos_aluno_instrutor_alunoId_instrutorId_tipoInstrutor_key" ON "vinculos_aluno_instrutor"("alunoId", "instrutorId", "tipoInstrutor");

-- CreateIndex
CREATE INDEX "historico_treinos_usuarioId_idx" ON "historico_treinos"("usuarioId");

-- CreateIndex
CREATE INDEX "historico_treinos_data_idx" ON "historico_treinos"("data");

-- CreateIndex
CREATE INDEX "anotacoes_treino_usuarioId_idx" ON "anotacoes_treino"("usuarioId");

-- CreateIndex
CREATE INDEX "videos_exercicio_usuarioId_idx" ON "videos_exercicio"("usuarioId");

-- CreateIndex
CREATE INDEX "videos_exercicio_status_idx" ON "videos_exercicio"("status");

-- CreateIndex
CREATE INDEX "videos_exercicio_criadoEm_idx" ON "videos_exercicio"("criadoEm");

-- CreateIndex
CREATE INDEX "fotos_progresso_usuarioId_idx" ON "fotos_progresso"("usuarioId");

-- CreateIndex
CREATE INDEX "fotos_progresso_data_idx" ON "fotos_progresso"("data");

-- CreateIndex
CREATE INDEX "medicoes_corporais_usuarioId_idx" ON "medicoes_corporais"("usuarioId");

-- CreateIndex
CREATE INDEX "medicoes_corporais_data_idx" ON "medicoes_corporais"("data");

-- CreateIndex
CREATE INDEX "metas_usuarioId_idx" ON "metas"("usuarioId");

-- CreateIndex
CREATE INDEX "conquistas_usuarioId_idx" ON "conquistas"("usuarioId");

-- CreateIndex
CREATE INDEX "desafios_usuarioId_idx" ON "desafios"("usuarioId");

-- CreateIndex
CREATE INDEX "desafios_dataFim_idx" ON "desafios"("dataFim");

-- CreateIndex
CREATE INDEX "rankings_pontos_idx" ON "rankings"("pontos");

-- CreateIndex
CREATE INDEX "rankings_nivel_idx" ON "rankings"("nivel");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_usuarioId_key" ON "rankings"("usuarioId");

-- CreateIndex
CREATE INDEX "postagens_usuarioId_idx" ON "postagens"("usuarioId");

-- CreateIndex
CREATE INDEX "postagens_criadoEm_idx" ON "postagens"("criadoEm");

-- CreateIndex
CREATE INDEX "membros_grupo_usuarioId_idx" ON "membros_grupo"("usuarioId");

-- CreateIndex
CREATE INDEX "membros_grupo_grupoId_idx" ON "membros_grupo"("grupoId");

-- CreateIndex
CREATE UNIQUE INDEX "membros_grupo_grupoId_usuarioId_key" ON "membros_grupo"("grupoId", "usuarioId");

-- CreateIndex
CREATE INDEX "previsoes_ia_usuarioId_idx" ON "previsoes_ia"("usuarioId");

-- CreateIndex
CREATE INDEX "previsoes_ia_tipo_idx" ON "previsoes_ia"("tipo");

-- CreateIndex
CREATE INDEX "analises_recuperacao_usuarioId_idx" ON "analises_recuperacao"("usuarioId");

-- CreateIndex
CREATE INDEX "analises_recuperacao_data_idx" ON "analises_recuperacao"("data");

-- CreateIndex
CREATE INDEX "relatorios_usuarioId_idx" ON "relatorios"("usuarioId");

-- CreateIndex
CREATE INDEX "relatorios_tipo_idx" ON "relatorios"("tipo");

-- CreateIndex
CREATE INDEX "notificacoes_usuarioId_idx" ON "notificacoes"("usuarioId");

-- CreateIndex
CREATE INDEX "notificacoes_lida_idx" ON "notificacoes"("lida");

-- CreateIndex
CREATE INDEX "itens_carrinho_usuarioId_idx" ON "itens_carrinho"("usuarioId");

-- CreateIndex
CREATE INDEX "leads_academiaId_idx" ON "leads"("academiaId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "tickets_manutencao_academiaId_idx" ON "tickets_manutencao"("academiaId");

-- CreateIndex
CREATE INDEX "tickets_manutencao_status_idx" ON "tickets_manutencao"("status");

-- CreateIndex
CREATE INDEX "produtos_academiaId_idx" ON "produtos"("academiaId");

-- CreateIndex
CREATE INDEX "produtos_categoria_idx" ON "produtos"("categoria");

-- CreateIndex
CREATE INDEX "produtos_ativo_idx" ON "produtos"("ativo");

-- CreateIndex
CREATE INDEX "vendas_produtos_academiaId_idx" ON "vendas_produtos"("academiaId");

-- CreateIndex
CREATE INDEX "vendas_produtos_dataVenda_idx" ON "vendas_produtos"("dataVenda");

-- CreateIndex
CREATE INDEX "vendas_produtos_produtoId_idx" ON "vendas_produtos"("produtoId");

-- CreateIndex
CREATE INDEX "funcionarios_academiaId_idx" ON "funcionarios"("academiaId");

-- CreateIndex
CREATE INDEX "funcionarios_ativo_idx" ON "funcionarios"("ativo");

-- CreateIndex
CREATE INDEX "relatorios_financeiros_academiaId_idx" ON "relatorios_financeiros"("academiaId");

-- CreateIndex
CREATE INDEX "relatorios_financeiros_ano_mes_idx" ON "relatorios_financeiros"("ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "relatorios_financeiros_academiaId_ano_mes_key" ON "relatorios_financeiros"("academiaId", "ano", "mes");

-- CreateIndex
CREATE INDEX "registros_acesso_academiaId_idx" ON "registros_acesso"("academiaId");

-- CreateIndex
CREATE INDEX "registros_acesso_data_idx" ON "registros_acesso"("data");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_academiaId_fkey" FOREIGN KEY ("academiaId") REFERENCES "academias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculos_aluno_instrutor" ADD CONSTRAINT "vinculos_aluno_instrutor_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculos_aluno_instrutor" ADD CONSTRAINT "vinculos_aluno_instrutor_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_treinos" ADD CONSTRAINT "historico_treinos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes_treino" ADD CONSTRAINT "anotacoes_treino_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos_exercicio" ADD CONSTRAINT "videos_exercicio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_progresso" ADD CONSTRAINT "fotos_progresso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicoes_corporais" ADD CONSTRAINT "medicoes_corporais_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas" ADD CONSTRAINT "metas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conquistas" ADD CONSTRAINT "conquistas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafios" ADD CONSTRAINT "desafios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postagens" ADD CONSTRAINT "postagens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_grupo" ADD CONSTRAINT "membros_grupo_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_grupo" ADD CONSTRAINT "membros_grupo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previsoes_ia" ADD CONSTRAINT "previsoes_ia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_recuperacao" ADD CONSTRAINT "analises_recuperacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_carrinho" ADD CONSTRAINT "itens_carrinho_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas_produtos" ADD CONSTRAINT "vendas_produtos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
