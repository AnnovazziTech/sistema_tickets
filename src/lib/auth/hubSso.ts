/**
 * Integração SSO com o Hub de Acesso FAJ (https://sistemas.grupofaj.com.br).
 *
 * O acesso em produção é sempre via hub: o usuário loga no hub (Microsoft Entra ID),
 * clica no card "Tickets FAJ" e o hub redireciona para /api/auth/sso/callback?token=<JWT>.
 * Este módulo VERIFICA esse JWT (RS256, via JWKS do hub) e traduz os claims para o
 * modelo da plataforma (papel + setor). A plataforma CONFIA no `nivel` do hub — o RBAC
 * é resolvido lá (regra de setor + override individual + admin global).
 *
 * Contrato do token (ver reference-hub-acesso-sso):
 *   header  { alg:'RS256', kid, typ:'JWT' }
 *   claims  { sub, email, nome, app, nivel:'membro'|'gestor'|'admin', setor_id, iss, aud, exp }
 *   TTL 300s — trocamos por sessão própria imediatamente.
 */
import { createRemoteJWKSet, jwtVerify } from "jose";
import { query } from "@/lib/db";
import type { Papel } from "@/lib/auth/resolverPapel";

const JWKS_URL =
  process.env.HUB_SSO_JWKS_URL ?? "https://sistemas.grupofaj.com.br/.well-known/jwks.json";
const ISSUER = process.env.HUB_SSO_ISSUER ?? "https://sistemas.grupofaj.com.br";
const APP_SLUG = process.env.SSO_APP_SLUG ?? "tickets";

export type NivelHub = "bloqueado" | "membro" | "gestor" | "admin";

export type ClaimsHub = {
  sub: string; // usuario_id (sistema_ata.usuarios.id)
  email: string;
  nome: string;
  app: string;
  nivel: NivelHub;
  setorId: string | null; // uuid em sistema_ata.setores (setor principal)
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(JWKS_URL));
  return jwks;
}

/** Verifica o JWT emitido pelo hub. Devolve os claims ou null (assinatura/issuer/aud/exp inválidos). */
export async function verificarTokenHub(token: string): Promise<ClaimsHub | null> {
  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: ISSUER,
      audience: APP_SLUG,
      algorithms: ["RS256"],
    });
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!sub || !email) return null;
    const nivel = String(payload.nivel ?? "membro").toLowerCase() as NivelHub;
    return {
      sub,
      email: email.toLowerCase(),
      nome: typeof payload.nome === "string" ? payload.nome : email.split("@")[0],
      app: typeof payload.app === "string" ? payload.app : APP_SLUG,
      nivel: ["bloqueado", "membro", "gestor", "admin"].includes(nivel) ? nivel : "membro",
      setorId: typeof payload.setor_id === "string" ? payload.setor_id : null,
    };
  } catch {
    return null;
  }
}

/** Traduz o nível do hub para o papel da plataforma. `bloqueado` nunca chega aqui (o hub barra antes). */
export function nivelParaPapel(nivel: NivelHub): Papel {
  if (nivel === "admin") return "ADMIN";
  if (nivel === "gestor") return "GESTOR";
  return "MEMBRO";
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Mapeia o setor_id do diretório (sistema_ata.setores, uuid) para o slug de um setor
 * habilitado na plataforma (tickets.setores). Casa pelo nome normalizado. Best-effort:
 * devolve {slug,nome} ou nulos se não houver correspondência.
 */
export async function resolverSetor(
  setorAtaId: string | null,
): Promise<{ setorSlug: string | null; setorNome: string | null }> {
  if (!setorAtaId) return { setorSlug: null, setorNome: null };
  try {
    const rows = await query<{ nome: string }>(
      `SELECT nome FROM sistema_ata.setores WHERE id = $1 LIMIT 1`,
      [setorAtaId],
    );
    const nome = rows[0]?.nome ?? null;
    if (!nome) return { setorSlug: null, setorNome: null };
    const m = await query<{ slug: string }>(
      `SELECT slug FROM tickets.setores WHERE slug = $1 AND ativo LIMIT 1`,
      [slugify(nome)],
    );
    return { setorSlug: m[0]?.slug ?? null, setorNome: nome };
  } catch (err) {
    console.error("[hubSso.resolverSetor]", err);
    return { setorSlug: null, setorNome: null };
  }
}

/** Sincroniza a projeção local (tickets.usuarios) a partir dos claims do hub. Best-effort. */
export async function sincronizarUsuario(
  c: ClaimsHub,
  papel: Papel,
  setorNome: string | null,
): Promise<void> {
  try {
    await query(
      `INSERT INTO tickets.usuarios (id, email, nome, setor_id, setor_nome, papel, nivel_acesso, sincronizado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email, nome = EXCLUDED.nome, setor_id = EXCLUDED.setor_id,
             setor_nome = EXCLUDED.setor_nome, papel = EXCLUDED.papel,
             nivel_acesso = EXCLUDED.nivel_acesso, sincronizado_em = now()`,
      [c.sub, c.email, c.nome, c.setorId, setorNome, papel, c.nivel],
    );
  } catch (err) {
    console.error("[hubSso.sincronizarUsuario]", err);
  }
}
