import { NextResponse } from "next/server";
import { criarTicket } from "@/lib/tickets/criarTicket";

// Shim de compatibilidade: a antiga rota do DHO agora delega ao pipeline genérico.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const r = await criarTicket("dho", "movimentacao", body);
  if (!r.ok) {
    return NextResponse.json({ error: r.error, issues: r.issues }, { status: r.status });
  }
  return NextResponse.json(r.data, { status: r.status });
}
