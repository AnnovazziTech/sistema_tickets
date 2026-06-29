import { NextResponse } from "next/server";
import { ehAdmin, sessaoAtual } from "@/lib/auth/sessao";
import { publicar } from "@/lib/forms/builderRepo";
import type { FormDef } from "@/lib/forms/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ehAdmin())) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  const { id } = await params;

  let body: { def?: FormDef };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  if (!body.def) return NextResponse.json({ error: "Definição ausente." }, { status: 422 });

  const sessao = await sessaoAtual();
  const autorId = (sessao?.user as { id?: string } | undefined)?.id ?? null;

  try {
    const versaoId = await publicar(Number(id), body.def, autorId);
    return NextResponse.json({ versaoId, publicado: true });
  } catch (err) {
    console.error("[POST /api/formularios/:id/publicar]", err);
    return NextResponse.json({ error: "Não foi possível publicar." }, { status: 503 });
  }
}
