import seed from "./seed/dho.json";
import type { FormDef } from "./tipos";

/**
 * Definição-semente do DHO (movimentação). É a FONTE ÚNICA, consumida por:
 *  - `scripts/seed.mjs` (grava o formulário publicado no banco);
 *  - o repositório `getFormularioPublicado` (fallback de desenvolvimento sem banco).
 */
export type SeedFormulario = {
  setor: { slug: string; nome: string; icone: string; cor: string };
  formulario: { slug: string; nome: string; descricao: string; icone: string; prefixo: string };
  sla: { tempo_primeira_resposta_min: number; tempo_resolucao_min: number; prioridade: number };
  definicao: FormDef;
};

export const SEED_DHO = seed as unknown as SeedFormulario;
