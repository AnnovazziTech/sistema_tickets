import type { Campo } from "./tipos";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function competenciaPorExtenso(yyyymm: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(yyyymm);
  if (!m) return yyyymm;
  return `${MESES[Number(m[2]) - 1]}/${m[1]}`;
}

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function rotuloOpcao(campo: Campo, valor: string): string {
  return campo.opcoes?.find((o) => o.valor === valor)?.rotulo ?? valor;
}

/** Formata o valor de uma resposta para exibição (e-mail, detalhe do ticket). */
export function formatarResposta(campo: Campo, valor: unknown): string {
  if (valor == null || valor === "") return "";
  switch (campo.tipo) {
    case "moeda":
      return typeof valor === "number" ? brl(valor) : String(valor);
    case "simNao":
    case "toggle":
      return valor ? "Sim" : "Não";
    case "mes":
      return competenciaPorExtenso(String(valor));
    case "select":
    case "radio":
      return rotuloOpcao(campo, String(valor));
    case "multiselect":
    case "checkboxes":
      return Array.isArray(valor)
        ? valor.map((v) => rotuloOpcao(campo, String(v))).join(", ")
        : String(valor);
    case "upload":
      return Array.isArray(valor) ? (valor as { nome: string }[]).map((a) => a.nome).join(", ") : "";
    default:
      return String(valor);
  }
}
