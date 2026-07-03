import { NextResponse } from "next/server";
import { authAtivo, sessaoAtual } from "@/lib/auth/sessao";
import { assumirTicket } from "@/lib/tickets/ticketRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await sessaoAtual();
  const pode = !authAtivo() || sessao?.user?.papel === "ADMIN" || sessao?.user?.papel === "GESTOR";
  if (!pode) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const { id } = await params;
  try {
    const ok = await assumirTicket(Number(id), {
      id: (sessao?.user as { id?: string } | undefined)?.id,
      nome: sessao?.user?.name ?? "Responsável",
    });
    if (!ok) return NextResponse.json({ error: "Ticket não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST assumir]", err);
    return NextResponse.json({ error: "Falha ao assumir." }, { status: 503 });
  }
}
