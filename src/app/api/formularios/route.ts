import { NextResponse } from "next/server";
import { ehAdmin } from "@/lib/auth/sessao";
import { criarFormulario, listarFormularios } from "@/lib/forms/builderRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await ehAdmin())) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  return NextResponse.json({ formularios: await listarFormularios() });
}

export async function POST(req: Request) {
  if (!(await ehAdmin())) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  let body: { setorId?: string; slug?: string; nome?: string; descricao?: string; prefixo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  if (!body.setorId || !body.slug || !body.nome || !body.prefixo) {
    return NextResponse.json({ error: "Informe setor, slug, nome e prefixo." }, { status: 422 });
  }

  try {
    const id = await criarFormulario({
      setorId: body.setorId,
      slug: body.slug.trim(),
      nome: body.nome.trim(),
      descricao: body.descricao?.trim(),
      prefixo: body.prefixo.trim().toUpperCase(),
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/formularios]", err);
    return NextResponse.json(
      { error: "Não foi possível criar o formulário (verifique DATABASE_URL e a migração)." },
      { status: 503 },
    );
  }
}
