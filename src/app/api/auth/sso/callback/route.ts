import { NextResponse, type NextRequest } from "next/server";
import { signIn } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * Callback do SSO do Hub de Acesso FAJ.
 * O hub redireciona para cá com ?token=<JWT RS256>. Validamos o token (dentro do provider
 * "hub-sso") e trocamos por sessão própria (cookie NextAuth). O token do hub dura só 5 min.
 *
 * URL registrada no hub: https://tickets.grupofaj.com.br/api/auth/sso/callback
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const destino = req.nextUrl.searchParams.get("callbackUrl") || "/";
  if (!token) {
    return NextResponse.redirect(new URL("/login?erro=sso-sem-token", req.url));
  }
  try {
    // redirect:false → estabelece a sessão e retorna sem lançar o redirect interno.
    await signIn("hub-sso", { token, redirect: false });
  } catch {
    return NextResponse.redirect(new URL("/login?erro=sso-invalido", req.url));
  }
  return NextResponse.redirect(new URL(destino, req.url));
}
