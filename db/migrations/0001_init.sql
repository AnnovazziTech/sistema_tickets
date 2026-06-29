-- Sistema de Tickets DHO — Movimentação de Funcionários
-- Migração idempotente: pode ser executada mais de uma vez sem efeitos colaterais.

CREATE SCHEMA IF NOT EXISTS dho;

CREATE TABLE IF NOT EXISTS dho.movimentacao (
  id                    bigserial PRIMARY KEY,
  protocolo             text UNIQUE,

  -- Funcionário
  nome_funcionario      text NOT NULL,
  novo_cargo            text NOT NULL,

  -- Remuneração
  alteracao_salarial    boolean NOT NULL,
  novo_salario          numeric(12, 2),
  ajuda_custo           boolean NOT NULL,
  valor_ajuda_custo     numeric(12, 2),
  cargo_confianca       boolean NOT NULL,

  -- Transferência (opcional) — unidade / departamento / setor
  transferencia         boolean NOT NULL DEFAULT false,
  nova_unidade          text,
  novo_departamento     text,
  novo_setor            text,

  -- Vigência: armazenada como o 1º dia do mês de competência
  competencia_vigencia  date NOT NULL,

  -- Solicitante (gestor) e observações
  solicitante_nome      text,
  solicitante_email     text,
  observacoes           text,

  -- Workflow do ticket
  status                text NOT NULL DEFAULT 'aberto',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Coerência dos campos condicionais (espelha as regras da tela)
  CONSTRAINT chk_salario CHECK (NOT alteracao_salarial OR novo_salario IS NOT NULL),
  CONSTRAINT chk_ajuda   CHECK (NOT ajuda_custo OR valor_ajuda_custo IS NOT NULL),
  CONSTRAINT chk_status  CHECK (status IN ('aberto', 'em_analise', 'aprovado', 'reprovado', 'concluido', 'cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_mov_competencia ON dho.movimentacao (competencia_vigencia);
CREATE INDEX IF NOT EXISTS idx_mov_status      ON dho.movimentacao (status);
CREATE INDEX IF NOT EXISTS idx_mov_created      ON dho.movimentacao (created_at DESC);

COMMENT ON TABLE dho.movimentacao IS 'Tickets de solicitação de movimentação de funcionários (cargo / salário / transferência) abertos por gestores.';
COMMENT ON COLUMN dho.movimentacao.competencia_vigencia IS 'Mês de início da movimentação, normalizado para o 1º dia do mês.';
COMMENT ON COLUMN dho.movimentacao.cargo_confianca IS 'Sim/Não — percentual é fixo, por isso não há campo de valor.';
