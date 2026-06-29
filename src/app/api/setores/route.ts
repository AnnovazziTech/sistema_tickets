import { NextResponse } from "next/server";
import { ehAdmin } from "@/lib/auth/sessao";
import { criarSetor, listarSetores } from "@/lib/forms/builderRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await ehAdmin())) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  return NextResponse.json({ setores: await listarSetores() });
}

export async function POST(req: Request) {
  if (!(await ehAdmin())) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  let body: { slug?: string; nome?: string; icone?: string; cor?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  if (!body.slug || !body.nome) {
    return NextResponse.json({ error: "Informe nome e slug do setor." }, { status: 422 });
  }

  try {
    const id = await criarSetor({
      slug: body.slug.trim(),
      nome: body.nome.trim(),
      icone: body.icone?.trim(),
      cor: body.cor?.trim(),
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/setores]", err);
    return NextResponse.json(
      { error: "Não foi possível criar o setor (verifique DATABASE_URL e a migração)." },
      { status: 503 },
    );
  }
}
