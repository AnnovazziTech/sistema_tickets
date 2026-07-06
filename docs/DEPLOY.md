# Deploy — Tickets FAJ

Padrão do grupo: **Docker Swarm + Traefik** no Hetzner (`89.167.5.131`), rede externa
`network_public`, TLS via Let's Encrypt (`letsencryptresolver`). Mesmo modelo do Hub de Acesso.

- **Domínio:** `https://tickets.grupofaj.com.br`
- **Imagem:** `tickets-faj:latest`
- **Porta interna:** 3000 · **Healthcheck:** `/api/health`

## 1. DNS

Criar registro **A**: `tickets.grupofaj.com.br` → `89.167.5.131`. O Traefik emite o certificado
Let's Encrypt automaticamente no primeiro acesso (resolve o "não seguro").

## 2. `.env` de produção (em `/root/tickets/.env` no servidor)

Nunca versionar. **Não** inclui `AUTH_DEV_LOGIN` (produção é só via hub).

> ⚠️ **SEM aspas nos valores.** `docker stack deploy` (Swarm) lê o `env_file` literalmente — aspas
> viram parte do valor e quebram URL/`DATABASE_URL`/secret. (Aspas só para valores com espaço.)

```env
DATABASE_URL=postgresql://USER:SENHA@89.167.5.131:32789/dwfaj
AUTH_SECRET=COLE_AQUI_O_openssl_rand_base64_32
# SSO via Hub de Acesso FAJ
HUB_SSO_JWKS_URL=https://sistemas.grupofaj.com.br/.well-known/jwks.json
HUB_SSO_ISSUER=https://sistemas.grupofaj.com.br
SSO_APP_SLUG=tickets
# E-mail (opcional — sem isto o ticket grava, só não notifica)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=conta-de-servico@grupofaj.com.br
SMTP_PASS=app-password
MAIL_TO=dp@grupofaj.com.br, rh@grupofaj.com.br
```

## 3. Build + deploy (no servidor)

```bash
# clonar/atualizar o repo e copiar o compose + .env para /root/tickets/
cd /root/tickets
docker build -t tickets-faj:latest .
docker stack deploy -c docker-compose.prod.yml tickets
```

Atualização de versão: rebuild da imagem + `docker stack deploy` de novo (rolling update
`start-first`, com rollback automático em falha).

## 4. Migrações (uma vez)

O schema `tickets` já foi migrado no dwfaj; o comando é idempotente:

```bash
docker run --rm --env-file .env tickets-faj:latest node scripts/migrate.mjs
# (e, se quiser reseedar os setores/DHO) node scripts/seed.mjs
```

## 5. Verificação

1. `curl -fsS https://tickets.grupofaj.com.br/api/health` → `{"ok":true,...}` e cadeado válido.
2. Logar no hub → card **Tickets FAJ** → clicar → cai autenticado (ver [INTEGRACAO-HUB.md](./INTEGRACAO-HUB.md)).
3. `docker service ls` / `docker service logs tickets_tickets` para acompanhar.

> Dependências do lado hub (registro do app, permissões, `FEATURE_SSO_OUTBOUND=true`) estão em
> [INTEGRACAO-HUB.md](./INTEGRACAO-HUB.md). Sem `aceita_sso`+flag ligados, o hub redireciona para
> `tickets.grupofaj.com.br` **sem** token e o usuário cai no `/login`.
