# Go-Live — Tickets FAJ (deploy + integração com o Hub)

Runbook único e ordenado para colocar o **Tickets FAJ** no ar em `https://tickets.grupofaj.com.br`
e ligado ao **Hub de Acesso FAJ** via SSO. Execute as fases **na ordem**. Detalhes por tema em
[DEPLOY.md](./DEPLOY.md) e [INTEGRACAO-HUB.md](./INTEGRACAO-HUB.md).

> **Servidores:** Swarm/Traefik/Postgres no Hetzner `89.167.5.131`. Hub em `sistemas.grupofaj.com.br`.

## Valores que os dois lados DEVEM combinar (se algo divergir, o SSO falha calado)

| Item | Valor exato |
|---|---|
| slug / audience | `tickets` |
| callback | `https://tickets.grupofaj.com.br/api/auth/sso/callback` |
| issuer (NEXTAUTH_URL do hub) | `https://sistemas.grupofaj.com.br` |
| `aceita_sso` | `true` |
| `FEATURE_SSO_OUTBOUND` (hub) | `true` |

---

## Fase 1 — Deploy do Tickets (resolve o "não seguro")

O domínio já resolve e o Traefik responde, mas **sem certificado válido** porque o serviço ainda
não subiu. Subir a stack registra o router e o Traefik emite o Let's Encrypt automaticamente.

1. **DNS** (se ainda não existir): A `tickets.grupofaj.com.br` → `89.167.5.131`.
2. No servidor, em `/root/tickets/`:
   ```bash
   git clone https://github.com/AnnovazziTech/sistema_tickets.git /root/tickets   # ou: cd /root/tickets && git pull
   cd /root/tickets
   ```
3. Criar `/root/tickets/.env` (NÃO versionar; **sem** `AUTH_DEV_LOGIN`).
   ⚠️ **SEM aspas nos valores** — `docker stack deploy` (Swarm) lê o `env_file` literal e as aspas
   entram no valor, quebrando URL/DB/secret. Só use aspas se o valor tiver espaço (não é o caso aqui).
   ```env
   DATABASE_URL=postgresql://USER:SENHA@89.167.5.131:32789/dwfaj
   AUTH_SECRET=COLE_AQUI_O_openssl_rand_base64_32
   HUB_SSO_JWKS_URL=https://sistemas.grupofaj.com.br/.well-known/jwks.json
   HUB_SSO_ISSUER=https://sistemas.grupofaj.com.br
   SSO_APP_SLUG=tickets
   # E-mail (opcional): SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS + MAIL_TO=dp@grupofaj.com.br, rh@grupofaj.com.br
   ```
4. Build + deploy:
   ```bash
   docker build -t tickets-faj:latest .
   docker stack deploy -c docker-compose.prod.yml tickets
   ```
5. (uma vez) migração — idempotente: `docker run --rm --env-file .env tickets-faj:latest node scripts/migrate.mjs`
6. **Verificar:** `curl -fsS https://tickets.grupofaj.com.br/api/health` → `{"ok":true,...}` com cadeado válido.

✅ Ao fim da Fase 1 o "não seguro" some. O login já mostra o botão "Entrar pelo Hub", mas o SSO só
funciona após as Fases 2 e 3.

---

## Fase 2 — Registrar o app no Hub

Via UI admin do hub (**Aplicações → Nova** + **Permissões**) **ou** o SQL abaixo numa conexão de
**escrita** no schema `hub_acesso` (o MCP `faj-data` é read-only). Idempotente.

```sql
-- 2.1 app
INSERT INTO hub_acesso.aplicacoes
  (slug, nome, descricao, url_producao, icone, cor_acento, setor_principal,
   aceita_sso, sso_callback_url, publico, ativo, ordem_display)
VALUES
  ('tickets', 'Tickets FAJ',
   'Plataforma universal de tickets no-code (multi-setor). Admin: Controladoria e P&D.',
   'https://tickets.grupofaj.com.br', 'Ticket', '#ED7219', 'Controladoria',
   true, 'https://tickets.grupofaj.com.br/api/auth/sso/callback', false, true, 155)
ON CONFLICT (slug) DO UPDATE
  SET nome=EXCLUDED.nome, url_producao=EXCLUDED.url_producao, aceita_sso=EXCLUDED.aceita_sso,
      sso_callback_url=EXCLUDED.sso_callback_url, setor_principal=EXCLUDED.setor_principal,
      atualizado_em=now();

-- 2.2 liberar todos os setores ativos como 'membro'
INSERT INTO hub_acesso.permissoes_setor (aplicacao_id, setor_id, nivel)
SELECT a.id, s.id, 'membro'::hub_acesso."NivelPermissao"
  FROM hub_acesso.aplicacoes a CROSS JOIN sistema_ata.setores s
 WHERE a.slug='tickets' AND s.ativo=true
ON CONFLICT (aplicacao_id, setor_id) DO NOTHING;

-- 2.3 gestores de setor viram 'gestor' (override individual). Admins globais já têm 'admin'.
INSERT INTO hub_acesso.permissoes_usuario (aplicacao_id, usuario_id, nivel, motivo)
SELECT a.id, g.gestor_id, 'gestor'::hub_acesso."NivelPermissao", 'Gestor de setor (auto)'
  FROM hub_acesso.aplicacoes a
  CROSS JOIN (SELECT DISTINCT gestor_id FROM sistema_ata.gestores_setores) g
 WHERE a.slug='tickets'
ON CONFLICT (aplicacao_id, usuario_id) DO NOTHING;

-- 2.4 (opcional) aposentar o placeholder antigo
UPDATE hub_acesso.aplicacoes SET ativo=false, atualizado_em=now() WHERE slug='tickets-ped';
```

---

## Fase 3 — Ligar o SSO outbound no Hub

No `.env.production` do hub: `FEATURE_SSO_OUTBOUND="true"` (hoje `false`) e reiniciar o serviço.
As chaves de assinatura já estão configuradas (JWKS no ar, `kid=hub-acesso-prod-2026-06-02`).

> Enquanto a flag estiver `false`, o hub redireciona para `tickets.grupofaj.com.br` **sem token** e
> o usuário cai no `/login`. Só ligue a flag **depois** da Fase 1 concluída.

---

## Fase 4 — Teste ponta a ponta

1. Logar no hub → o card **Tickets FAJ** aparece para quem tem permissão.
2. Clicar no card → `/apps/tickets/abrir` → redireciona com `?token=` → cai autenticado no tickets.
3. Conferir papel: admin (Controladoria/P&D) vê `/admin`; gestor vê a fila do seu setor; membro abre ticket.
4. Auditoria no hub: `hub_acesso.logs_acesso` com `app_aberto` + `sso_emitido`.

**Rollback:** `FEATURE_SSO_OUTBOUND=false` no hub (volta a redirecionar direto) ou
`UPDATE hub_acesso.aplicacoes SET ativo=false WHERE slug='tickets';` (tira o card).
