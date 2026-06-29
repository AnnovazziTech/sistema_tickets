import { NextResponse } from "next/server";
import { authAtivo, sessaoAtual } from "@/lib/auth/sessao";
import { mudarStatus } from "@/lib/tickets/ticketRepo";
import { STATUS_VALIDOS, type StatusTicket } from "@/lib/tickets/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await sessaoAtual();
  const podeGerir =
    !authAtivo() || sessao?.user?.papel === "ADMIN" || sessao?.user?.papel === "GESTOR";
  if (!podeGerir) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const { id } = await params;
  let body: { status?: string; comentario?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  if (!body.status || !STATUS_VALIDOS.includes(body.status as StatusTicket)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 422 });
  }

  try {
    const ok = await mudarStatus(Number(id), body.status as StatusTicket, body.comentario?.trim() || null, {
      id: (sessao?.user as { id?: string } | undefined)?.id,
      nome: sessao?.user?.name ?? null,
    });
    if (!ok) return NextResponse.json({ error: "Ticket não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH status]", err);
    return NextResponse.json({ error: "Falha ao atualizar o status." }, { status: 503 });
  }
}
