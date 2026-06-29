import { NextResponse } from "next/server";
import { ehAdmin } from "@/lib/auth/sessao";
import { salvarRascunho } from "@/lib/forms/builderRepo";
import type { FormDef } from "@/lib/forms/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ehAdmin())) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  const { id } = await params;

  let body: { def?: FormDef };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  if (!body.def) return NextResponse.json({ error: "Definição ausente." }, { status: 422 });

  try {
    const versaoId = await salvarRascunho(Number(id), body.def);
    return NextResponse.json({ versaoId });
  } catch (err) {
    console.error("[PUT /api/formularios/:id]", err);
    return NextResponse.json({ error: "Não foi possível salvar o rascunho." }, { status: 503 });
  }
}
