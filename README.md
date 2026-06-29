# Tickets FAJ — Plataforma Universal de Tickets

Plataforma **multi-setor** e **no-code** de tickets do Grupo FAJ. A **Controladoria** e o **P&D**
(perfil **ADMIN**) cadastram setores e **montam a tela de cada setor escolhendo componentes** de um
catálogo (builder visual, sem código); os **gestores** abrem tickets do seu setor; e um **dashboard
administrativo** acompanha SLA de resposta, volumetria por setor e os KPIs de gestão.

> **Ideia central:** cada formulário deixa de ser código e vira um **documento JSON versionado**.
> Um único motor (`buildZodSchema` + `FormRenderer`) renderiza e valida **qualquer** tela, e um
> único pipeline grava **qualquer** ticket. O formulário de **movimentação de funcionários do DHO**
> é o primeiro formulário (seed) — prova o motor de ponta a ponta.

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Modelo de dados](#modelo-de-dados-schema-tickets)
- [O motor no-code](#o-motor-no-code)
- [Catálogo de componentes](#catálogo-de-componentes)
- [Builder (montagem das telas)](#builder-montagem-das-telas)
- [Autenticação e papéis (RBAC)](#autenticação-e-papéis-rbac)
- [Ciclo de vida do ticket e SLA](#ciclo-de-vida-do-ticket-e-sla)
- [Dashboard e KPIs](#dashboard-e-kpis)
- [Notificações por e-mail](#notificações-por-e-mail)
- [Referência da API](#referência-da-api)
- [Mapa de rotas](#mapa-de-rotas)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Instalação e execução](#instalação-e-execução)
- [Scripts](#scripts)
- [Fluxo completo de uso](#fluxo-completo-de-uso)
- [Decisões e limitações do MVP](#decisões-e-limitações-do-mvp)

---

## Visão geral

O sistema nasceu de uma única tela (movimentação de funcionários do DHO) e foi generalizado para
uma **plataforma de tickets de toda a empresa**, onde:

1. **Admin (Controladoria/P&D)** cadastra **setores** e, para cada setor, monta um ou mais
   **formulários** arrastando/escolhendo componentes — sem escrever código.
2. **Gestores** abrem tickets preenchendo o formulário publicado do seu setor.
3. Cada ticket entra num fluxo de **status** com **SLA** (tempo de 1ª resposta e de resolução).
4. O **dashboard admin** consolida volumetria, SLA e KPIs de todos os setores.

Tudo é dirigido por dados: a definição de cada formulário é um JSON versionado no banco, então
criar/editar telas **não exige deploy** — basta publicar uma nova versão pelo builder.

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) |
| UI | **React 19** + **TypeScript** + **Tailwind CSS 4** (tokens `faj-` via `@theme`) |
| Validação | **Zod** (schema gerado dinamicamente da definição do formulário) |
| Banco | **PostgreSQL** (`dwfaj`), acesso via **`pg`** + SQL puro (migrações idempotentes) |
| Autenticação | **NextAuth v5** — Microsoft Entra ID (SSO) + login dev |
| Gráficos | **Recharts** |
| E-mail | **nodemailer** (SMTP, best-effort) |
| Ícones | **lucide-react** |

Sem ORM (não usa Prisma): as queries são SQL parametrizado via um pool `pg` lazy. Sem shadcn:
componentes próprios e leves, alinhados ao design system do grupo (faj-suite).

---

## Arquitetura

```
                          ┌──────────────────────────────────────────────┐
   Gestor (navegador) ───▶│  /[setor]/[formulario]  → FormRenderer        │
                          │     • lê a definição JSON publicada            │
                          │     • valida (Zod gerado) e POSTa o ticket     │
                          └───────────────┬──────────────────────────────┘
                                          │  POST /api/abrir/[setor]/[form]
                                          ▼
                          ┌──────────────────────────────────────────────┐
                          │  criarTicket()  → grava em tickets.tickets     │
                          │     • snapshot de SLA  • protocolo  • e-mail   │
                          └───────────────┬──────────────────────────────┘
                                          ▼
   Admin (Controladoria/P&D) ──▶ /admin   │            PostgreSQL dwfaj
     • /admin/setores  (cadastra setor)   │      ┌───────────────────────┐
     • /admin/builder  (monta a tela)─────┼─────▶│ schema  tickets         │
     • /admin/dashboard (SLA/KPIs)        │      │  setores · formularios   │
                                          └─────▶│  formulario_versoes(jsonb)│
                                                 │  tickets · sla_config     │
                                                 │  ticket_historico · ...   │
                                                 └───────────────────────┘
                          (leitura read-only para catálogos e papéis:
                           descricao_cargo, admissao, sistema_ata, hub_acesso)
```

---

## Estrutura de pastas

```
sistema_tickets/
├─ db/migrations/
│  ├─ 0001_init.sql               # schema dho + dho.movimentacao (legado do 1º recorte)
│  └─ 0002_tickets_core.sql       # schema tickets + todas as tabelas da plataforma
├─ scripts/
│  ├─ migrate.mjs                 # roda as migrações (sem dependências extras)
│  └─ seed.mjs                    # semeia setores canônicos + formulário DHO (lê o JSON canônico)
├─ src/
│  ├─ auth.ts                     # NextAuth v5: Microsoft Entra ID + Credentials (dev)
│  ├─ app/
│  │  ├─ layout.tsx               # shell + cabeçalho (mostra usuário/papel/logout)
│  │  ├─ page.tsx                 # redireciona para /dho/movimentacao
│  │  ├─ login/                   # tela de login (SSO + dev)
│  │  ├─ sem-acesso/              # 403 amigável (área restrita)
│  │  ├─ (gestor)/                # área autenticada de gestor (gating no layout)
│  │  │  ├─ [setorSlug]/[formSlug]/page.tsx   # abre o formulário publicado (FormRenderer)
│  │  │  └─ tickets/[id]/page.tsx              # detalhe do ticket + timeline + troca de status
│  │  ├─ admin/                   # área ADMIN (gating no layout)
│  │  │  ├─ layout.tsx            # restringe a ADMIN + sub-nav (Dashboard/Setores/Builder)
│  │  │  ├─ dashboard/page.tsx    # KPIs, volumetria, séries, recentes
│  │  │  ├─ setores/              # cadastrar/listar setores
│  │  │  └─ builder/              # listar/criar formulários + editor visual
│  │  └─ api/
│  │     ├─ abrir/[setorSlug]/[formSlug]/route.ts   # POST: abre ticket (pipeline genérico)
│  │     ├─ movimentacao/route.ts                    # shim de compatibilidade (DHO)
│  │     ├─ setores/route.ts                         # GET/POST setores (ADMIN)
│  │     ├─ formularios/route.ts                     # GET/POST formulários (ADMIN)
│  │     ├─ formularios/[id]/route.ts                # PUT: salvar rascunho (ADMIN)
│  │     ├─ formularios/[id]/publicar/route.ts       # POST: publicar versão (ADMIN)
│  │     ├─ tickets/[id]/status/route.ts             # PATCH: trocar status (ADMIN/GESTOR)
│  │     └─ auth/[...nextauth]/route.ts              # handlers do NextAuth
│  ├─ components/
│  │  ├─ ui.tsx                   # PageHeader, Card, brl (apresentacionais)
│  │  ├─ form-fields.tsx          # TODOS os campos controlados (texto, moeda, select, ...)
│  │  ├─ renderer/                # FormRenderer + CampoDinamico (motor de render)
│  │  ├─ builder/                 # Paleta, FormBuilder, Inspetor, EditorCondicao, IconeDinamico
│  │  ├─ dashboard/               # Graficos (Recharts) + KpiCard
│  │  └─ tickets/                 # StatusChanger
│  └─ lib/
│     ├─ db.ts                    # pool pg lazy + temBanco()
│     ├─ catalogos.ts             # leitura de cargos/unidades/funcionários (servidor)
│     ├─ catalogos-shared.ts      # tipo Catalogos + listaCatalogo (client-safe)
│     ├─ email.ts                 # enviarNotificacaoTicket (SMTP, best-effort)
│     ├─ dashboard.ts             # consultas agregadas (KPIs/volumetria/séries)
│     ├─ auth/
│     │  ├─ resolverPapel.ts      # mapeia e-mail → ADMIN/GESTOR/MEMBRO (sistema_ata/hub_acesso)
│     │  └─ sessao.ts             # authAtivo(), sessaoAtual(), ehAdmin()
│     ├─ forms/
│     │  ├─ tipos.ts              # FormDef, Secao, Campo, Condicao, TipoCampo...
│     │  ├─ avaliarCondicao.ts    # avalia regras visivelQuando/obrigatorioQuando
│     │  ├─ buildZodSchema.ts     # gera o schema Zod a partir da definição
│     │  ├─ formatarResposta.ts   # formata valores por tipo (e-mail/detalhe)
│     │  ├─ catalogoComponentes.ts# metadados de cada tipo de componente (paleta)
│     │  ├─ repo.ts               # getFormularioPublicado (+ fallback do seed em memória)
│     │  ├─ builderRepo.ts        # CRUD de setores/formulários/versões (admin)
│     │  ├─ seedDho.ts            # carrega o JSON canônico do DHO
│     │  └─ seed/dho.json         # ★ definição canônica do formulário DHO (app + seed)
│     └─ tickets/
│        ├─ criarTicket.ts        # valida + grava ticket + SLA + histórico + e-mail
│        ├─ ticketRepo.ts         # getTicket + mudarStatus (cálculo de SLA)
│        └─ status.ts             # rótulos/cores de status (client-safe)
└─ .env.example                  # modelo de variáveis de ambiente
```

---

## Modelo de dados (schema `tickets`)

Decisão central: **a definição do formulário e as respostas do ticket ficam em JSONB**. Isso torna
versionamento, reordenação e regras condicionais um simples documento; só desnormalizamos as
colunas de **SLA/status** (que precisam de índice/filtro). Referências a `sistema_ata`/`hub_acesso`
são **soft** (uuid sem FK cross-schema).

| Tabela | Papel |
|---|---|
| `tickets.setores` | Setores habilitados (`slug`, `nome`, `icone`, `cor`). |
| `tickets.formularios` | 1 setor : N formulários (`slug`, `prefixo_protocolo`, `versao_publicada_id`). |
| `tickets.formulario_versoes` | **Definição JSON versionada** (`rascunho`/`publicada`/`arquivada`). |
| `tickets.sla_config` | Metas de SLA por formulário (1ª resposta e resolução, em minutos). |
| `tickets.tickets` | Ticket genérico: `respostas jsonb` + colunas de SLA/status + `protocolo`. |
| `tickets.ticket_historico` | Timeline de mudanças de status (de → para, autor, comentário). |
| `tickets.ticket_comentarios` | Comentários/anexos (metadados). |
| `tickets.usuarios` | Projeção local de identidade/papel (sincronizada do diretório corporativo). |

O **protocolo** é `PREFIXO-AAAA-NNNNN` (ex.: `MOV-2026-00002`), gerado em dois passos
(`INSERT … RETURNING id` → `UPDATE protocolo`), porque uma CTE `INSERT…UPDATE` na mesma tabela não
enxergaria a linha recém-inserida.

---

## O motor no-code

Três peças puras e reutilizáveis (cliente **e** servidor) transformam um JSON em uma tela validada:

- **`lib/forms/tipos.ts`** — o contrato. `FormDef` = `{ titulo, avisos[], notificacoes, secoes[] }`;
  cada `Campo` tem `id, tipo, label, obrigatorio?, largura?, opcoes?, catalogo?, visivelQuando?,
  obrigatorioQuando?`.
- **`avaliarCondicao.ts`** — avalia uma condição declarativa
  `{ campo, operador, valor }` (operadores: igual, diferente, preenchido, vazio, maiorQue,
  menorQue, em; combináveis por `todas`/`alguma`). Usada tanto na **visibilidade** (renderer)
  quanto na **obrigatoriedade** (validação) — DRY.
- **`buildZodSchema.ts`** — gera um `z.object(...).superRefine(...)` a partir da definição: base
  permissiva por tipo (nunca falha por vazio) + um único `superRefine` que aplica obrigatoriedade
  estática/condicional respeitando a visibilidade. Erros saem com `path:[campo.id]`.

No cliente, **`components/renderer/FormRenderer.tsx`** mantém o estado das respostas, esconde
campos invisíveis (e limpa seus valores), valida com `buildZodSchema` antes de enviar e mostra a
tela de sucesso com o protocolo. **`CampoDinamico.tsx`** mapeia cada `tipo` para o componente certo
de `form-fields.tsx`.

### Exemplo de definição (trecho)

```jsonc
{
  "titulo": "Movimentação de Funcionários",
  "campoTitulo": "nomeFuncionario",
  "avisos": [{ "tipo": "alerta", "texto": "Registre até o dia 25..." }],
  "notificacoes": { "emails": ["dp@grupofaj.com.br", "rh@grupofaj.com.br"] },
  "secoes": [{
    "id": "remuneracao", "titulo": "Remuneração", "colunas": 2,
    "campos": [
      { "id": "alteracaoSalarial", "tipo": "simNao", "label": "Haverá alteração salarial?", "obrigatorio": true },
      { "id": "novoSalario", "tipo": "moeda", "label": "Novo salário",
        "visivelQuando":     { "campo": "alteracaoSalarial", "operador": "igual", "valor": true },
        "obrigatorioQuando": { "campo": "alteracaoSalarial", "operador": "igual", "valor": true } }
    ]
  }]
}
```

---

## Catálogo de componentes

Todos disponíveis na paleta do builder (`lib/forms/catalogoComponentes.ts`):

| Grupo | Tipos |
|---|---|
| **Entrada** | `texto`, `textarea`, `numero`, `moeda` (R$), `data`, `mes`/competência, `dataHora`, `email`, `telefone`, `cpfCnpj` |
| **Escolha** | `select`, `multiselect`, `radio`, `simNao`, `checkboxes`, `toggle` |
| **Especiais** | `lookup` (busca em catálogo: cargos/unidades/funcionários), `upload` (metadados no MVP), `somenteLeitura` |
| **Layout** | `cabecalho`, `banner` (info/alerta/sucesso), `divisor` |

Os **lookups** são alimentados em tempo real pelo `dwfaj` (cargos publicados, obras ativas,
funcionários), com **degradação graciosa**: se o banco estiver indisponível, viram texto livre.

---

## Builder (montagem das telas)

Em **`/admin/builder/[formId]`** (`components/builder/FormBuilder.tsx`), três painéis:

- **Paleta** (esquerda): todos os componentes agrupados — um clique adiciona à seção selecionada.
- **Canvas** (centro): seções (1–3 colunas), campos com reordenação (↑/↓) e remoção, mais um modo
  **Pré-visualizar** que renderiza o `FormRenderer` real com a definição atual.
- **Inspetor** (direita): edita rótulo, obrigatoriedade, largura, opções, fonte de catálogo e o
  **construtor visual de regras condicionais** (`visivelQuando` / `obrigatorioQuando`).

Saída = o JSON da definição. **Salvar rascunho** grava uma versão `rascunho`; **Publicar** marca a
versão como `publicada` e aponta `formularios.versao_publicada_id` — é essa versão que os gestores
passam a ver. Versões antigas continuam preservadas (cada ticket guarda a versão usada).

---

## Autenticação e papéis (RBAC)

NextAuth v5 (`src/auth.ts`) com dois provedores:

- **Microsoft Entra ID** (produção): SSO corporativo (Microsoft 365).
- **Credentials (dev)**: habilitado só com `AUTH_DEV_LOGIN=true` — permite escolher o papel no login
  para testar sem Azure.

O papel é resolvido em `lib/auth/resolverPapel.ts` a partir do diretório `sistema_ata.usuarios`
(+ `gestores_setores`):

- **ADMIN** — `nivel_acesso = 'admin'` **ou** setor ∈ {Controladoria, P&D}. Acessa `/admin`.
- **GESTOR** — `nivel_acesso = 'gestor'` **ou** consta em `gestores_setores`. Abre/gerencia tickets.
- **MEMBRO** — demais.

> **Auth é opt-in por ambiente:** sem `AUTH_SECRET`, a plataforma roda **aberta** (modo dev, ótimo
> para visualizar). Com `AUTH_SECRET`, o gating é aplicado (layouts de `(gestor)` e `admin` checam
> a sessão e redirecionam). O link "Admin" no topo só aparece para ADMIN.

---

## Ciclo de vida do ticket e SLA

1. **Abertura** (`criarTicket`): valida as respostas, grava em `tickets.tickets`, faz **snapshot**
   das metas de SLA (de `sla_config`), gera o protocolo, registra o 1º histórico (`aberto`) e
   dispara o e-mail.
2. **Transições** (`PATCH /api/tickets/[id]/status` → `mudarStatus`): ao sair de `aberto`, grava
   `data_primeira_resposta` e calcula `sla_resposta_estourado`; ao concluir/reprovar/cancelar, grava
   `data_fechamento`, `duracao_minutos` e `sla_resolucao_estourado`. Cada transição entra no
   histórico.
3. **Status**: `aberto → em_analise → aguardando_solicitante → aprovado/reprovado → concluido`
   (+ `cancelado`).

---

## Dashboard e KPIs

`/admin/dashboard` (`lib/dashboard.ts` + `components/dashboard/Graficos.tsx`):

- **KPIs**: tickets abertos, **% SLA estourado**, tempo médio de **1ª resposta** e de **resolução**.
- **Barras**: volumetria de abertos **por setor**.
- **Donut**: distribuição por status.
- **Linha**: abertos × fechados nos últimos 30 dias.
- **Lista**: tickets recentes (link para o detalhe).

Consultas agregadas em SQL (`count(... ) FILTER`, `avg(EXTRACT(EPOCH ...))`, `generate_series`).

---

## Notificações por e-mail

`lib/email.ts` envia, a cada ticket, um e-mail (HTML + texto) com as respostas formatadas. Os
**destinatários** vêm da definição do formulário (`notificacoes.emails`) — o DHO já aponta para
`dp@grupofaj.com.br` e `rh@grupofaj.com.br` — com fallback para `MAIL_TO`. É **best-effort**: se o
SMTP não estiver configurado ou falhar, o ticket é gravado mesmo assim (`emailEnviado: false`).

---

## Referência da API

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/abrir/[setorSlug]/[formSlug]` | público* | Abre um ticket (valida contra a definição publicada). |
| `POST` | `/api/movimentacao` | público* | Shim de compatibilidade do DHO (delega ao genérico). |
| `GET/POST` | `/api/setores` | ADMIN | Lista / cria setor. |
| `GET/POST` | `/api/formularios` | ADMIN | Lista / cria formulário. |
| `PUT` | `/api/formularios/[id]` | ADMIN | Salva rascunho da definição. |
| `POST` | `/api/formularios/[id]/publicar` | ADMIN | Publica nova versão. |
| `PATCH` | `/api/tickets/[id]/status` | ADMIN/GESTOR | Troca status (recalcula SLA + histórico). |
| `GET/POST` | `/api/auth/[...nextauth]` | — | Handlers do NextAuth. |

\* "público" = sem login quando a auth está desativada; com auth ativa, a abertura fica sob a área
autenticada do gestor.

Respostas de erro padronizadas: `400` (corpo inválido), `403` (acesso restrito), `404`
(não encontrado), `422` (validação, com `issues:[{path,message}]`), `503` (banco indisponível).

---

## Mapa de rotas

| Rota | Quem | O quê |
|---|---|---|
| `/` | todos | redireciona para `/dho/movimentacao` |
| `/[setor]/[formulario]` | gestor | abre o formulário publicado |
| `/tickets/[id]` | gestor/admin | detalhe + timeline + troca de status |
| `/login` · `/sem-acesso` | todos | login / 403 |
| `/admin/dashboard` | ADMIN | KPIs e SLA |
| `/admin/setores` | ADMIN | cadastrar setores |
| `/admin/builder` · `/admin/builder/[id]` | ADMIN | listar/criar e montar formulários |

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim (p/ gravar) | Conexão Postgres `dwfaj` com permissão de escrita no schema `tickets`. |
| `PGSSLMODE` | não | Defina (ex.: `require`) se o servidor exigir SSL. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | não | Envio de e-mail (ex.: Office 365). |
| `MAIL_FROM` / `MAIL_TO` | não | Remetente / destinatários padrão (DP e RH). |
| `AUTH_SECRET` | p/ ligar login | Ativa o RBAC (gere com `npx auth secret`). Sem ele, app roda aberto. |
| `AUTH_DEV_LOGIN` / `AUTH_DEV_PASSWORD` | não | Login de desenvolvimento (escolhe papel). |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` / `_ISSUER` | produção | SSO Microsoft Entra ID. |

> **Segredos nunca são versionados:** `.env`, `.env.local` e `node_modules`/`.next` estão no
> `.gitignore`.

---

## Instalação e execução

```bash
npm install
cp .env.example .env.local        # preencha DATABASE_URL (e o que mais quiser)
npm run migrate                   # cria os schemas/tabelas (idempotente)
npm run seed                      # cria setores canônicos + publica o formulário DHO
npm run dev                       # http://localhost:3000
```

Produção: `npm run build && npm run start`. Requer **Node.js ≥ 20.9**.

Sem `DATABASE_URL`, a aplicação ainda **sobe**: `/dho/movimentacao` e o builder em
`/admin/builder/demo` funcionam a partir do seed em memória (apenas leitura/visualização —
gravação exige banco).

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Turbopack, hot-reload). |
| `npm run build` | Build de produção. |
| `npm run start` | Sobe o build de produção. |
| `npm run migrate` | Aplica `db/migrations/*.sql` no `DATABASE_URL`. |
| `npm run seed` | Semeia setores canônicos + formulário DHO (a partir de `src/lib/forms/seed/*.json`). |

---

## Fluxo completo de uso

1. **Cadastrar setor** — `/admin/setores` → "Novo setor" (ex.: *Comercial* → slug `/comercial`).
2. **Criar formulário** — `/admin/builder` → "Novo formulário" (escolhe o setor, nome e prefixo).
3. **Montar a tela** — no builder: arrasta componentes da paleta, configura no inspetor, define
   regras condicionais, **pré-visualiza** e **publica**.
4. **Abrir tickets** — o gestor acessa `/<setor>/<formulario>`, preenche e envia (recebe protocolo;
   DP/RH são notificados quando o SMTP está configurado).
5. **Acompanhar** — `/admin/dashboard` (SLA/volumetria/KPIs) e `/tickets/[id]` (detalhe + troca de
   status com cálculo de SLA).

---

## Decisões e limitações do MVP

- **Sem ORM** (pg + SQL) e **sem shadcn** — para um build enxuto e alinhado ao faj-suite.
- **Upload**: o tipo existe no catálogo, mas só guarda metadados (storage de binário fica para
  uma fase futura).
- **SLA "dia 25" do DHO** modelado como meta em minutos (refino futuro).
- **Builder**: reordenação por ↑/↓ (sem drag-and-drop), condições com 1 nível de combinação.
- **Schema `tickets` isolado**: lê em modo read-only `descricao_cargo`, `admissao`, `sistema_ata` e
  `hub_acesso`; nunca os altera.

---

*Plataforma interna do **Grupo FAJ**. Desenvolvido com Next.js 16.*
