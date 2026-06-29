// Parte client-safe dos catálogos (tipo + resolvedor). NÃO importa `pg`/db,
// para poder ser usada em componentes 'use client'. O fetch fica em catalogos.ts (servidor).

export type Catalogos = {
  /** Cargos publicados (descricao_cargo.Cargo). */
  cargos: string[];
  /** Unidades/obras ativas (admissao.obras). */
  unidades: string[];
  /** Funcionários (admissao.funcionarios_ativos). */
  funcionarios: string[];
};

export const CATALOGOS_VAZIO: Catalogos = { cargos: [], unidades: [], funcionarios: [] };

/** Resolve a lista de uma fonte de catálogo pelo nome (usado pelo renderer). */
export function listaCatalogo(catalogos: Catalogos, fonte: string | undefined): string[] {
  switch (fonte) {
    case "cargos":
      return catalogos.cargos;
    case "unidades":
      return catalogos.unidades;
    case "funcionarios":
      return catalogos.funcionarios;
    default:
      return [];
  }
}
