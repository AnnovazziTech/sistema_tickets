// Tipos da definição de formulário no-code (compartilhados cliente/servidor).
// A definição é um documento JSON versionado, produzido pelo builder e consumido pelo renderer.

export type TipoCampo =
  // Entrada
  | "texto"
  | "textarea"
  | "numero"
  | "moeda"
  | "data"
  | "mes"
  | "dataHora"
  | "email"
  | "telefone"
  | "cpfCnpj"
  // Escolha
  | "select"
  | "multiselect"
  | "radio"
  | "simNao"
  | "checkboxes"
  | "toggle"
  // Especiais
  | "lookup"
  | "upload"
  | "somenteLeitura"
  // Layout (não geram resposta)
  | "cabecalho"
  | "banner"
  | "divisor";

export type FonteCatalogo = "cargos" | "unidades" | "funcionarios" | "setores";

export type Operador =
  | "igual"
  | "diferente"
  | "preenchido"
  | "vazio"
  | "maiorQue"
  | "menorQue"
  | "em";

/** Condição declarativa. Folha = {campo,operador,valor}; composta = {todas|alguma:[...]}. */
export type Condicao =
  | { campo: string; operador: Operador; valor?: unknown }
  | { todas: CondicaoFolha[] }
  | { alguma: CondicaoFolha[] };

export type CondicaoFolha = { campo: string; operador: Operador; valor?: unknown };

export type Largura = "full" | "half" | "third";

export type Opcao = { valor: string; rotulo: string };

export type Campo = {
  id: string;
  tipo: TipoCampo;
  label: string;
  obrigatorio?: boolean;
  dica?: string;
  placeholder?: string;
  default?: unknown;
  largura?: Largura;

  // Escolha
  opcoes?: Opcao[];
  maxSelecoes?: number;

  // Número / moeda / texto
  min?: number;
  max?: number;
  passo?: number;
  linhas?: number; // textarea

  // Especiais
  catalogo?: FonteCatalogo; // lookup / select com fonte do dwfaj
  aceita?: string; // upload (accept)
  multiplo?: boolean; // upload
  conteudo?: string; // cabecalho / banner / somenteLeitura
  tomBanner?: "info" | "alerta" | "sucesso";

  // Regras condicionais
  visivelQuando?: Condicao;
  obrigatorioQuando?: Condicao;
};

export type Secao = {
  id: string;
  titulo?: string;
  descricao?: string;
  colunas?: 1 | 2 | 3;
  campos: Campo[];
};

export type Aviso = { tipo: "info" | "alerta" | "sucesso"; texto: string };

export type Notificacoes = {
  emails?: string[];
  assuntoTemplate?: string;
};

export type FormDef = {
  versaoSchema: number;
  titulo: string;
  descricao?: string;
  /** id do campo cujo valor vira o título do ticket. */
  campoTitulo?: string;
  avisos?: Aviso[];
  notificacoes?: Notificacoes;
  secoes: Secao[];
};

/** Tipos de campo que não produzem valor de resposta nem entram na validação. */
export const TIPOS_LAYOUT: ReadonlySet<TipoCampo> = new Set<TipoCampo>([
  "cabecalho",
  "banner",
  "divisor",
]);

/** Itera todos os campos de todas as seções em ordem. */
export function todosCampos(def: FormDef): Campo[] {
  return def.secoes.flatMap((s) => s.campos);
}

/** Campos que produzem resposta (exclui layout). */
export function camposDeDados(def: FormDef): Campo[] {
  return todosCampos(def).filter((c) => !TIPOS_LAYOUT.has(c.tipo));
}
