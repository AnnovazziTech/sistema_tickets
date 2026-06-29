import { query, temBanco } from "@/lib/db";
import type { FormDef } from "./tipos";

export type FormularioResumo = {
  id: number;
  nome: string;
  slug: string;
  setorNome: string;
  setorSlug: string;
  ativo: boolean;
  publicado: boolean;
};

export type FormularioEdicao = {
  id: number;
  nome: string;
  slug: string;
  prefixo: string;
  setorNome: string;
  setorSlug: string;
  def: FormDef;
};

export type SetorResumo = { id: string; slug: string; nome: string; icone?: string };

export function defVazio(titulo: string): FormDef {
  return {
    versaoSchema: 1,
    titulo,
    secoes: [{ id: "secao1", titulo: "Seção 1", colunas: 1, campos: [] }],
  };
}

export async function listarFormularios(): Promise<FormularioResumo[]> {
  if (!temBanco()) return [];
  try {
    const rows = await query<{
      id: number;
      nome: string;
      slug: string;
      setor_nome: string;
      setor_slug: string;
      ativo: boolean;
      publicado: boolean;
    }>(
      `SELECT f.id, f.nome, f.slug, s.nome AS setor_nome, s.slug AS setor_slug, f.ativo,
              (f.versao_publicada_id IS NOT NULL) AS publicado
         FROM tickets.formularios f
         JOIN tickets.setores s ON s.id = f.setor_id
        ORDER BY s.nome, f.nome`,
    );
    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      slug: r.slug,
      setorNome: r.setor_nome,
      setorSlug: r.setor_slug,
      ativo: r.ativo,
      publicado: r.publicado,
    }));
  } catch (err) {
    console.error("[builderRepo.listarFormularios]", err);
    return [];
  }
}

export async function listarSetores(): Promise<SetorResumo[]> {
  if (!temBanco()) return [];
  try {
    return await query<SetorResumo>(
      `SELECT id, slug, nome, icone FROM tickets.setores WHERE ativo ORDER BY nome`,
    );
  } catch {
    return [];
  }
}

export async function criarSetor(input: {
  slug: string;
  nome: string;
  icone?: string;
  cor?: string;
}): Promise<string> {
  const id = (
    await query<{ id: string }>(
      `INSERT INTO tickets.setores (slug, nome, icone, cor)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome, icone = EXCLUDED.icone, cor = EXCLUDED.cor
       RETURNING id`,
      [input.slug, input.nome, input.icone ?? "Folder", input.cor ?? "#162763"],
    )
  )[0].id;
  return id;
}

export async function getFormularioParaEdicao(id: number): Promise<FormularioEdicao | null> {
  if (!temBanco()) return null;
  try {
    const meta = (
      await query<{
        id: number;
        nome: string;
        slug: string;
        prefixo_protocolo: string;
        setor_nome: string;
        setor_slug: string;
      }>(
        `SELECT f.id, f.nome, f.slug, f.prefixo_protocolo, s.nome AS setor_nome, s.slug AS setor_slug
           FROM tickets.formularios f
           JOIN tickets.setores s ON s.id = f.setor_id
          WHERE f.id = $1`,
        [id],
      )
    )[0];
    if (!meta) return null;
    const ver = (
      await query<{ definicao: FormDef }>(
        `SELECT definicao FROM tickets.formulario_versoes
          WHERE formulario_id = $1
          ORDER BY (status = 'rascunho') DESC, versao DESC
          LIMIT 1`,
        [id],
      )
    )[0];
    return {
      id: meta.id,
      nome: meta.nome,
      slug: meta.slug,
      prefixo: meta.prefixo_protocolo,
      setorNome: meta.setor_nome,
      setorSlug: meta.setor_slug,
      def: ver?.definicao ?? defVazio(meta.nome),
    };
  } catch (err) {
    console.error("[builderRepo.getFormularioParaEdicao]", err);
    return null;
  }
}

export async function criarFormulario(input: {
  setorId: string;
  slug: string;
  nome: string;
  descricao?: string;
  prefixo: string;
}): Promise<number> {
  const id = (
    await query<{ id: number }>(
      `INSERT INTO tickets.formularios (setor_id, slug, nome, descricao, prefixo_protocolo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.setorId, input.slug, input.nome, input.descricao ?? null, input.prefixo],
    )
  )[0].id;
  await query(
    `INSERT INTO tickets.formulario_versoes (formulario_id, versao, definicao, status)
     VALUES ($1, 1, $2::jsonb, 'rascunho')`,
    [id, JSON.stringify(defVazio(input.nome))],
  );
  return id;
}

export async function salvarRascunho(id: number, def: FormDef): Promise<number> {
  const r = (
    await query<{ id: number }>(
      `SELECT id FROM tickets.formulario_versoes
        WHERE formulario_id = $1 AND status = 'rascunho'
        ORDER BY versao DESC LIMIT 1`,
      [id],
    )
  )[0];
  if (r) {
    await query(`UPDATE tickets.formulario_versoes SET definicao = $2::jsonb WHERE id = $1`, [
      r.id,
      JSON.stringify(def),
    ]);
    return r.id;
  }
  const nv = (
    await query<{ nv: number }>(
      `SELECT COALESCE(MAX(versao), 0) + 1 AS nv FROM tickets.formulario_versoes WHERE formulario_id = $1`,
      [id],
    )
  )[0].nv;
  const ins = (
    await query<{ id: number }>(
      `INSERT INTO tickets.formulario_versoes (formulario_id, versao, definicao, status)
       VALUES ($1, $2, $3::jsonb, 'rascunho') RETURNING id`,
      [id, nv, JSON.stringify(def)],
    )
  )[0];
  return ins.id;
}

export async function publicar(id: number, def: FormDef, autorId?: string | null): Promise<number> {
  const r = (
    await query<{ id: number }>(
      `SELECT id FROM tickets.formulario_versoes
        WHERE formulario_id = $1 AND status = 'rascunho'
        ORDER BY versao DESC LIMIT 1`,
      [id],
    )
  )[0];
  let versaoId: number;
  if (r) {
    await query(
      `UPDATE tickets.formulario_versoes
          SET definicao = $2::jsonb, status = 'publicada', publicado_em = now(), publicado_por = $3
        WHERE id = $1`,
      [r.id, JSON.stringify(def), autorId ?? null],
    );
    versaoId = r.id;
  } else {
    const nv = (
      await query<{ nv: number }>(
        `SELECT COALESCE(MAX(versao), 0) + 1 AS nv FROM tickets.formulario_versoes WHERE formulario_id = $1`,
        [id],
      )
    )[0].nv;
    versaoId = (
      await query<{ id: number }>(
        `INSERT INTO tickets.formulario_versoes (formulario_id, versao, definicao, status, publicado_em, publicado_por)
         VALUES ($1, $2, $3::jsonb, 'publicada', now(), $4) RETURNING id`,
        [id, nv, JSON.stringify(def), autorId ?? null],
      )
    )[0].id;
  }
  await query(`UPDATE tickets.formularios SET versao_publicada_id = $1, updated_at = now() WHERE id = $2`, [
    versaoId,
    id,
  ]);
  return versaoId;
}
