import { NextResponse, type NextRequest } from "next/server";
import { signIn } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * Callback do SSO do Hub de Acesso FAJ.
 * O hub redireciona para cá com ?token=<JWT RS256>. Validamos o token (dentro do provider
 * "hub-sso") e trocamos por sessão própria (cookie NextAuth). O token do hub dura só 5 min.
 *
 * URL registrada no hub: https://tickets.grupofaj.com.br/api/auth/sso/callback
 *
 * Redirect via Location RELATIVO (o navegador resolve contra o host real). Atrás do Traefik,
 * `req.url` traz o host interno do container (0.0.0.0:3000) — usar URL absoluta a partir dele
 * mandaria o usuário para um endereço morto.
 */
function redir(path: string) {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  // Só aceita caminho relativo interno (evita open-redirect).
  const cb = req.nextUrl.searchParams.get("callbackUrl");
  const destino = cb && cb.startsWith("/") && !cb.startsWith("//") ? cb : "/";

  if (!token) return redir("/login?erro=sso-sem-token");
  try {
    // redirect:false → estabelece a sessão (cookie) e retorna sem lançar o redirect interno.
    await signIn("hub-sso", { token, redirect: false });
  } catch {
    return redir("/login?erro=sso-invalido");
  }
  return redir(destino);
}
