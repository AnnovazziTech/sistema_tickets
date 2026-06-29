-- Plataforma Universal de Tickets FAJ — núcleo multi-setor (no-code).
-- Migração idempotente. Referências a sistema_ata/hub_acesso são SOFT (uuid sem FK cross-schema).

CREATE SCHEMA IF NOT EXISTS tickets;

DO $$ BEGIN
  CREATE TYPE tickets.ticket_status AS ENUM
    ('aberto', 'em_analise', 'aguardando_solicitante', 'aprovado', 'reprovado', 'concluido', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tickets.papel AS ENUM ('ADMIN', 'GESTOR', 'MEMBRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Projeção local de identidade/papel (sincronizável com sistema_ata.usuarios; id = mesmo uuid).
CREATE TABLE IF NOT EXISTS tickets.usuarios (
  id              uuid PRIMARY KEY,
  email           text UNIQUE NOT NULL,
  nome            text NOT NULL,
  microsoft_id    text,
  setor_id        uuid,
  setor_nome      text,
  papel           tickets.papel NOT NULL DEFAULT 'MEMBRO',
  nivel_acesso    text,
  dev_senha_hash  text,
  sincronizado_em timestamptz NOT NULL DEFAULT now()
);

-- Setores habilitados na plataforma (config própria; soft ref ao catálogo real).
CREATE TABLE IF NOT EXISTS tickets.setores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id   uuid UNIQUE,
  slug       text UNIQUE NOT NULL,
  nome       text NOT NULL,
  icone      text,
  cor        text,
  ativo      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Catálogo de formulários (1 setor : N formulários).
CREATE TABLE IF NOT EXISTS tickets.formularios (
  id                  bigserial PRIMARY KEY,
  setor_id            uuid NOT NULL REFERENCES tickets.setores(id) ON DELETE CASCADE,
  slug                text NOT NULL,
  nome                text NOT NULL,
  descricao           text,
  icone               text,
  prefixo_protocolo   text NOT NULL DEFAULT 'TKT',
  ativo               boolean NOT NULL DEFAULT true,
  versao_publicada_id bigint,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (setor_id, slug)
);

-- Definição versionada (o documento que o builder produz e o renderer consome).
CREATE TABLE IF NOT EXISTS tickets.formulario_versoes (
  id            bigserial PRIMARY KEY,
  formulario_id bigint NOT NULL REFERENCES tickets.formularios(id) ON DELETE CASCADE,
  versao        integer NOT NULL,
  definicao     jsonb NOT NULL,
  status        text NOT NULL DEFAULT 'rascunho'
                 CHECK (status IN ('rascunho', 'publicada', 'arquivada')),
  publicado_em  timestamptz,
  publicado_por uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (formulario_id, versao)
);

-- Config de SLA por formulário/tipo (clone de central_relacionamentos.cr_sla_config).
CREATE TABLE IF NOT EXISTS tickets.sla_config (
  id                          bigserial PRIMARY KEY,
  formulario_id               bigint REFERENCES tickets.formularios(id) ON DELETE CASCADE,
  tipo                        text,
  prioridade                  integer NOT NULL DEFAULT 0,
  tempo_primeira_resposta_min integer NOT NULL,
  tempo_resolucao_min         integer NOT NULL,
  ativo                       boolean NOT NULL DEFAULT true,
  UNIQUE (formulario_id, tipo)
);

-- Ticket genérico (respostas em JSONB + colunas SLA denormalizadas, clonadas de cr_atendimentos).
CREATE TABLE IF NOT EXISTS tickets.tickets (
  id                       bigserial PRIMARY KEY,
  protocolo                text UNIQUE,
  formulario_id            bigint NOT NULL REFERENCES tickets.formularios(id),
  formulario_versao_id     bigint NOT NULL REFERENCES tickets.formulario_versoes(id),
  setor_id                 uuid NOT NULL,
  titulo                   text,
  respostas                jsonb NOT NULL DEFAULT '{}'::jsonb,

  solicitante_usuario_id   uuid,
  solicitante_nome         text,
  solicitante_email        text,
  responsavel_usuario_id   uuid,

  status                   tickets.ticket_status NOT NULL DEFAULT 'aberto',
  prioridade               integer NOT NULL DEFAULT 0,
  data_abertura            timestamptz NOT NULL DEFAULT now(),
  data_primeira_resposta   timestamptz,
  data_fechamento          timestamptz,
  sla_resposta_meta_min    integer,
  sla_resolucao_meta_min   integer,
  sla_resposta_estourado   boolean NOT NULL DEFAULT false,
  sla_resolucao_estourado  boolean NOT NULL DEFAULT false,
  duracao_minutos          numeric,

  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tk_setor_status ON tickets.tickets (setor_id, status);
CREATE INDEX IF NOT EXISTS idx_tk_form         ON tickets.tickets (formulario_id);
CREATE INDEX IF NOT EXISTS idx_tk_abertura     ON tickets.tickets (data_abertura DESC);
CREATE INDEX IF NOT EXISTS idx_tk_status       ON tickets.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tk_respostas    ON tickets.tickets USING gin (respostas);

-- Histórico de status.
CREATE TABLE IF NOT EXISTS tickets.ticket_historico (
  id          bigserial PRIMARY KEY,
  ticket_id   bigint NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
  de_status   tickets.ticket_status,
  para_status tickets.ticket_status NOT NULL,
  autor_id    uuid,
  autor_nome  text,
  comentario  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hist_ticket ON tickets.ticket_historico (ticket_id, created_at);

-- Comentários / respostas (timeline).
CREATE TABLE IF NOT EXISTS tickets.ticket_comentarios (
  id         bigserial PRIMARY KEY,
  ticket_id  bigint NOT NULL REFERENCES tickets.tickets(id) ON DELETE CASCADE,
  autor_id   uuid,
  autor_nome text,
  corpo      text NOT NULL,
  interno    boolean NOT NULL DEFAULT false,
  anexos     jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coment_ticket ON tickets.ticket_comentarios (ticket_id, created_at);

COMMENT ON SCHEMA tickets IS 'Plataforma universal de tickets FAJ (multi-setor, no-code).';
COMMENT ON TABLE tickets.formulario_versoes IS 'Definição JSON versionada produzida pelo builder e consumida pelo renderer.';
COMMENT ON TABLE tickets.tickets IS 'Tickets genéricos: respostas em JSONB + colunas de SLA/status denormalizadas.';
