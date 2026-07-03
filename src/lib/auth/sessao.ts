import { auth } from "@/auth";
import type { Session } from "next-auth";

/** Auth só é aplicada quando configurada (AUTH_SECRET presente). Sem isso, app aberto (dev). */
export function authAtivo(): boolean {
  return !!process.env.AUTH_SECRET;
}

/** Sessão atual, ou null se auth desativada/erro. Nunca lança. */
export async function sessaoAtual(): Promise<Session | null> {
  if (!authAtivo()) return null;
  try {
    return await auth();
  } catch {
    return null;
  }
}

/** True se o usuário é ADMIN — ou se a auth está desativada (modo dev liberado). */
export async function ehAdmin(): Promise<boolean> {
  if (!authAtivo()) return true;
  const s = await sessaoAtual();
  return s?.user?.papel === "ADMIN";
}

export type Escopo = { logado: boolean; admin: boolean; setorSlug: string | null; nome: string | null };

/**
 * Escopo de visão do usuário atual. Sem auth (dev): admin liberado, sem restrição de setor.
 * Com auth: ADMIN vê tudo; demais são restritos ao próprio setor (setorSlug).
 */
export async function escopoAtual(): Promise<Escopo> {
  if (!authAtivo()) return { logado: true, admin: true, setorSlug: null, nome: null };
  const s = await sessaoAtual();
  return {
    logado: !!s,
    admin: s?.user?.papel === "ADMIN",
    setorSlug: s?.user?.setorSlug ?? null,
    nome: s?.user?.name ?? null,
  };
}
