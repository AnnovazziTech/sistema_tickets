import type { TipoCampo } from "./tipos";

export type GrupoComponente = "Entrada" | "Escolha" | "Especiais" | "Layout";

export type MetaComponente = {
  tipo: TipoCampo;
  rotulo: string;
  grupo: GrupoComponente;
  icone: string; // nome do ícone lucide (resolvido dinamicamente na paleta)
  temOpcoes?: boolean; // habilita editor de opções no inspetor
  temCatalogo?: boolean; // habilita seletor de fonte (cargos/unidades/...)
  layout?: boolean; // não gera resposta
};

export const CATALOGO: MetaComponente[] = [
  // Entrada
  { tipo: "texto", rotulo: "Texto", grupo: "Entrada", icone: "Type" },
  { tipo: "textarea", rotulo: "Texto longo", grupo: "Entrada", icone: "AlignLeft" },
  { tipo: "numero", rotulo: "Número", grupo: "Entrada", icone: "Hash" },
  { tipo: "moeda", rotulo: "Moeda (R$)", grupo: "Entrada", icone: "Banknote" },
  { tipo: "data", rotulo: "Data", grupo: "Entrada", icone: "Calendar" },
  { tipo: "mes", rotulo: "Mês/Competência", grupo: "Entrada", icone: "CalendarDays" },
  { tipo: "dataHora", rotulo: "Data e hora", grupo: "Entrada", icone: "Clock" },
  { tipo: "email", rotulo: "E-mail", grupo: "Entrada", icone: "Mail" },
  { tipo: "telefone", rotulo: "Telefone", grupo: "Entrada", icone: "Phone" },
  { tipo: "cpfCnpj", rotulo: "CPF / CNPJ", grupo: "Entrada", icone: "IdCard" },
  // Escolha
  { tipo: "select", rotulo: "Lista (select)", grupo: "Escolha", icone: "ChevronDown", temOpcoes: true, temCatalogo: true },
  { tipo: "multiselect", rotulo: "Múltipla (lista)", grupo: "Escolha", icone: "ListChecks", temOpcoes: true, temCatalogo: true },
  { tipo: "radio", rotulo: "Opções (radio)", grupo: "Escolha", icone: "CircleDot", temOpcoes: true },
  { tipo: "simNao", rotulo: "Sim / Não", grupo: "Escolha", icone: "ToggleLeft" },
  { tipo: "checkboxes", rotulo: "Caixas (multi)", grupo: "Escolha", icone: "CheckSquare", temOpcoes: true },
  { tipo: "toggle", rotulo: "Interruptor", grupo: "Escolha", icone: "ToggleRight" },
  // Especiais
  { tipo: "lookup", rotulo: "Busca em catálogo", grupo: "Especiais", icone: "Search", temCatalogo: true },
  { tipo: "upload", rotulo: "Anexo de arquivo", grupo: "Especiais", icone: "Upload" },
  { tipo: "somenteLeitura", rotulo: "Somente leitura", grupo: "Especiais", icone: "Lock" },
  // Layout
  { tipo: "cabecalho", rotulo: "Cabeçalho", grupo: "Layout", icone: "Heading", layout: true },
  { tipo: "banner", rotulo: "Aviso/Banner", grupo: "Layout", icone: "Info", layout: true },
  { tipo: "divisor", rotulo: "Divisor", grupo: "Layout", icone: "Minus", layout: true },
];

export const POR_TIPO: Record<TipoCampo, MetaComponente> = Object.fromEntries(
  CATALOGO.map((m) => [m.tipo, m]),
) as Record<TipoCampo, MetaComponente>;

export const GRUPOS: GrupoComponente[] = ["Entrada", "Escolha", "Especiais", "Layout"];
