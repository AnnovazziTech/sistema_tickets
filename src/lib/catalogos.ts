import { query, temBanco } from "./db";
import { CATALOGOS_VAZIO, type Catalogos } from "./catalogos-shared";

export type { Catalogos } from "./catalogos-shared";
export { listaCatalogo } from "./catalogos-shared";

/**
 * Lê catálogos do dwfaj para alimentar os autocompletes/seletores (servidor).
 * Conforto de UX: se o banco estiver indisponível, devolve listas vazias e a tela
 * continua funcionando com texto livre.
 */
export async function getCatalogos(): Promise<Catalogos> {
  if (!temBanco()) return CATALOGOS_VAZIO;
  try {
    const [cargos, unidades, funcionarios] = await Promise.all([
      query<{ cargo: string }>(
        `SELECT DISTINCT cargo
           FROM descricao_cargo."Cargo"
          WHERE cargo IS NOT NULL AND status = 'COMPLETO'
          ORDER BY cargo`,
      ),
      query<{ nome: string }>(
        `SELECT DISTINCT nome
           FROM admissao.obras
          WHERE ativo IS TRUE AND nome IS NOT NULL
          ORDER BY nome`,
      ),
      query<{ nome: string }>(
        `SELECT DISTINCT nome
           FROM admissao.funcionarios_ativos
          WHERE nome IS NOT NULL
          ORDER BY nome
          LIMIT 5000`,
      ),
    ]);
    return {
      cargos: cargos.map((r) => r.cargo),
      unidades: unidades.map((r) => r.nome),
      funcionarios: funcionarios.map((r) => r.nome),
    };
  } catch (err) {
    console.error("[catalogos] indisponíveis, usando texto livre:", err);
    return CATALOGOS_VAZIO;
  }
}
