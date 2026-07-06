import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness probe (Traefik + Docker HEALTHCHECK).
 * Propositalmente NÃO toca o banco — mede se o processo Next está de pé, não a saúde do DB
 * (uma instabilidade momentânea do Postgres não deve derrubar/ciclar o container).
 */
export async function GET() {
  return NextResponse.json({ ok: true, service: "tickets", ts: new Date().toISOString() });
}
