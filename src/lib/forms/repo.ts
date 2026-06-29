import { query, temBanco } from "@/lib/db";
import type { FormDef } from "./tipos";
import { SEED_DHO } from "./seedDho";

export type FormularioPublicado = {
  formularioId: number | null; // null = fallback em memória (sem banco)
  versaoId: number | null;
  setorId: string | null;
  setorSlug: string;
  setorNome: string;
  formSlug: string;
  nome: string;
  prefixo: string;
  def: FormDef;
};

type Linha = {
  formulario_id: number;
  versao_id: number;
  setor_id: string;
  setor_nome: string;
  nome: string;
  prefixo_protocolo: string;
  definicao: FormDef;
};

/**
 * Carrega a versão publicada de um formulário (setorSlug/formSlug). Tenta o banco;
 * se indisponível, cai no seed em memória (apenas DHO/movimentação) para que a tela
 * seja visualizável em desenvolvimento sem DATABASE_URL.
 */
export async function getFormularioPublicado(
  setorSlug: string,
  formSlug: string,
): Promise<FormularioPublicado | null> {
  if (temBanco()) {
   try {
    const rows = await query<Linha>(
      `SELECT f.id   AS formulario_id,
              fv.id  AS versao_id,
              s.id   AS setor_id,
              s.nome AS setor_nome,
              f.nome,
              f.prefixo_protocolo,
              fv.definicao
         FROM tickets.formularios f
         JOIN tickets.setores s            ON s.id = f.setor_id
         JOIN tickets.formulario_versoes fv ON fv.id = f.versao_publicada_id
        WHERE s.slug = $1 AND f.slug = $2 AND f.ativo`,
      [setorSlug, formSlug],
    );
    const r = rows[0];
    if (r) {
      return {
        formularioId: r.formulario_id,
        versaoId: r.versao_id,
        setorId: r.setor_id,
        setorSlug,
        setorNome: r.setor_nome,
        formSlug,
        nome: r.nome,
        prefixo: r.prefixo_protocolo,
        def: r.definicao,
      };
    }
   } catch (err) {
      console.error("[repo] formulários indisponíveis, tentando seed:", err);
    }
  }

  // Fallback de desenvolvimento (sem banco): apenas o DHO.
  if (setorSlug === SEED_DHO.setor.slug && formSlug === SEED_DHO.formulario.slug) {
    return {
      formularioId: null,
      versaoId: null,
      setorId: null,
      setorSlug: SEED_DHO.setor.slug,
      setorNome: SEED_DHO.setor.nome,
      formSlug: SEED_DHO.formulario.slug,
      nome: SEED_DHO.formulario.nome,
      prefixo: SEED_DHO.formulario.prefixo,
      def: SEED_DHO.definicao,
    };
  }
  return null;
}
