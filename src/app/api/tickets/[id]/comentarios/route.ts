import { NextResponse } from "next/server";
import { authAtivo, sessaoAtual } from "@/lib/auth/sessao";
import { adicionarComentario } from "@/lib/tickets/ticketRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await sessaoAtual();
  const pode = !authAtivo() || sessao?.user?.papel === "ADMIN" || sessao?.user?.papel === "GESTOR";
  if (!pode) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const { id } = await params;
  let body: { corpo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  if (!body.corpo?.trim()) return NextResponse.json({ error: "Comentário vazio." }, { status: 422 });

  try {
    const ok = await adicionarComentario(Number(id), body.corpo.trim(), {
      id: (sessao?.user as { id?: string } | undefined)?.id,
      nome: sessao?.user?.name ?? null,
    });
    if (!ok) return NextResponse.json({ error: "Ticket não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[POST comentarios]", err);
    return NextResponse.json({ error: "Falha ao comentar." }, { status: 503 });
  }
}
