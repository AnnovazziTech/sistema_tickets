# Integração com o Hub de Acesso FAJ

O **Tickets FAJ** é um **app-filho** do [Hub de Acesso FAJ](https://sistemas.grupofaj.com.br)
(`sistema_hub_acesso`). O hub autentica o colaborador no Microsoft Entra ID, aplica o RBAC por
setor e emite um **JWT curto (RS256)** que este sistema valida e troca por sessão própria.

- **Slug / audience:** `tickets`
- **Domínio:** `https://tickets.grupofaj.com.br`
- **Callback SSO:** `https://tickets.grupofaj.com.br/api/auth/sso/callback`
- **JWKS do hub:** `https://sistemas.grupofaj.com.br/.well-known/jwks.json`
- **Issuer:** `https://sistemas.grupofaj.com.br`

## Fluxo

```
Colaborador → Hub (login Microsoft) → clica "Tickets FAJ" (/apps/tickets/abrir)
  → Hub confere permissão e assina JWT (5 min) → redireciona para
  https://tickets.grupofaj.com.br/api/auth/sso/callback?token=<JWT>
  → Tickets valida (JWKS) e cria sessão própria (cookie NextAuth)
```

O token traz: `sub` (usuario_id), `email`, `nome`, `app`, `nivel` (`membro|gestor|admin`),
`setor_id`. O RBAC é do hub — o tickets **confia no `nivel`** (não recalcula). O nível vira o
papel da plataforma (`membro→MEMBRO`, `gestor→GESTOR`, `admin→ADMIN`) e o `setor_id` define o
escopo do setor.

## Variáveis de ambiente (lado tickets)

```env
HUB_SSO_JWKS_URL="https://sistemas.grupofaj.com.br/.well-known/jwks.json"
HUB_SSO_ISSUER="https://sistemas.grupofaj.com.br"
SSO_APP_SLUG="tickets"
```

---

## Configuração no HUB (rodar no schema `hub_acesso`)

> Pode ser feito pela UI admin do hub (**Aplicações → Nova** + **Permissões**) **ou** pelo SQL
> abaixo, numa conexão **com permissão de escrita** (o MCP `faj-data` é read-only). Idempotente.

### 1. Registrar o app

```sql
INSERT INTO hub_acesso.aplicacoes
  (slug, nome, descricao, url_producao, icone, cor_acento, setor_principal,
   aceita_sso, sso_callback_url, publico, ativo, ordem_display)
VALUES
  ('tickets', 'Tickets FAJ',
   'Plataforma universal de tickets no-code (multi-setor). Admin: Controladoria e P&D.',
   'https://tickets.grupofaj.com.br', 'Ticket', '#ED7219', 'Controladoria',
   true, 'https://tickets.grupofaj.com.br/api/auth/sso/callback', false, true, 155)
ON CONFLICT (slug) DO UPDATE
  SET nome = EXCLUDED.nome,
      url_producao = EXCLUDED.url_producao,
      aceita_sso = EXCLUDED.aceita_sso,
      sso_callback_url = EXCLUDED.sso_callback_url,
      setor_principal = EXCLUDED.setor_principal,
      atualizado_em = now();
```

### 2. Liberar acesso (todos os setores ativos = `membro`)

```sql
INSERT INTO hub_acesso.permissoes_setor (aplicacao_id, setor_id, nivel)
SELECT a.id, s.id, 'membro'::hub_acesso."NivelPermissao"
  FROM hub_acesso.aplicacoes a
  CROSS JOIN sistema_ata.setores s
 WHERE a.slug = 'tickets' AND s.ativo = true
ON CONFLICT (aplicacao_id, setor_id) DO NOTHING;
```

### 3. Gestores de setor viram `gestor` (override individual)

Os gestores reais (de `sistema_ata.gestores_setores`) ganham nível `gestor` no app — assim
gerenciam a fila do próprio setor. Admins globais (`nivel_acesso='admin'`) já têm `admin` em tudo.

```sql
INSERT INTO hub_acesso.permissoes_usuario (aplicacao_id, usuario_id, nivel, motivo)
SELECT a.id, g.gestor_id, 'gestor'::hub_acesso."NivelPermissao", 'Gestor de setor (auto)'
  FROM hub_acesso.aplicacoes a
  CROSS JOIN (SELECT DISTINCT gestor_id FROM sistema_ata.gestores_setores) g
 WHERE a.slug = 'tickets'
ON CONFLICT (aplicacao_id, usuario_id) DO NOTHING;
```

### 4. Ligar o SSO outbound

No `.env.production` do hub: `FEATURE_SSO_OUTBOUND="true"` (hoje `false`) e reiniciar. As chaves
`HUB_SSO_PRIVATE_KEY`/`HUB_SSO_PUBLIC_KEY` já estão configuradas (`kid=hub-acesso-prod-2026-06-02`).

### 5. (Opcional) Aposentar o placeholder `tickets-ped`

```sql
UPDATE hub_acesso.aplicacoes SET ativo = false, atualizado_em = now()
 WHERE slug = 'tickets-ped';
```

---

## Verificação

1. `GET https://sistemas.grupofaj.com.br/.well-known/jwks.json` responde com a chave pública.
2. Logado no hub, o card **Tickets FAJ** aparece para quem tem permissão.
3. Clicar no card → redireciona para o callback → cai autenticado em `https://tickets.grupofaj.com.br`.
4. Auditoria: `hub_acesso.logs_acesso` registra `app_aberto` e `sso_emitido`.
