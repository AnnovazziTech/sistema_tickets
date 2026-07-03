import { query, temBanco } from "@/lib/db";

export type FormPub = { slug: string; nome: string; descricao: string | null; icone: string | null };
export type SetorComForms = {
  slug: string;
  nome: string;
  icone: string | null;
  formularios: FormPub[];
};

/** Formulários publicados de um setor (para a home do setor). */
export async function listarFormulariosPublicados(setorSlug: string): Promise<FormPub[]> {
  if (!temBanco()) return [];
  try {
    return await query<FormPub>(
      `SELECT f.slug, f.nome, f.descricao, f.icone
         FROM tickets.formularios f
         JOIN tickets.setores s ON s.id = f.setor_id
        WHERE s.slug = $1 AND f.ativo AND f.versao_publicada_id IS NOT NULL
        ORDER BY f.nome`,
      [setorSlug],
    );
  } catch (err) {
    console.error("[listarFormulariosPublicados]", err);
    return [];
  }
}

/** Setores que têm ao menos um formulário publicado, com seus formulários (para a home). */
export async function listarSetoresComFormularios(): Promise<SetorComForms[]> {
  if (!temBanco()) return [];
  try {
    const rows = await query<{
      slug: string;
      nome: string;
      icone: string | null;
      f_slug: string;
      f_nome: string;
      f_descricao: string | null;
      f_icone: string | null;
    }>(
      `SELECT s.slug, s.nome, s.icone,
              f.slug AS f_slug, f.nome AS f_nome, f.descricao AS f_descricao, f.icone AS f_icone
         FROM tickets.setores s
         JOIN tickets.formularios f ON f.setor_id = s.id
        WHERE s.ativo AND f.ativo AND f.versao_publicada_id IS NOT NULL
        ORDER BY s.nome, f.nome`,
    );
    const mapa = new Map<string, SetorComForms>();
    for (const r of rows) {
      if (!mapa.has(r.slug)) mapa.set(r.slug, { slug: r.slug, nome: r.nome, icone: r.icone, formularios: [] });
      mapa.get(r.slug)!.formularios.push({
        slug: r.f_slug,
        nome: r.f_nome,
        descricao: r.f_descricao,
        icone: r.f_icone,
      });
    }
    return [...mapa.values()];
  } catch (err) {
    console.error("[listarSetoresComFormularios]", err);
    return [];
  }
}

/** Dados básicos de um setor pelo slug (cabeçalho da home do setor). */
export async function getSetorPorSlug(
  slug: string,
): Promise<{ slug: string; nome: string; icone: string | null } | null> {
  if (!temBanco()) return null;
  try {
    return (
      await query<{ slug: string; nome: string; icone: string | null }>(
        `SELECT slug, nome, icone FROM tickets.setores WHERE slug = $1 AND ativo`,
        [slug],
      )
    )[0] ?? null;
  } catch {
    return null;
  }
}
