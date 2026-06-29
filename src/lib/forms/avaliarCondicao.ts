import type { Condicao, CondicaoFolha } from "./tipos";

type Valores = Record<string, unknown>;

function vazio(v: unknown): boolean {
  return v == null || v === "" || (Array.isArray(v) && v.length === 0);
}

function avaliarFolha(c: CondicaoFolha, valores: Valores): boolean {
  const atual = valores[c.campo];
  switch (c.operador) {
    case "igual":
      return atual === c.valor;
    case "diferente":
      return atual !== c.valor;
    case "preenchido":
      return !vazio(atual);
    case "vazio":
      return vazio(atual);
    case "maiorQue":
      return typeof atual === "number" && typeof c.valor === "number" && atual > c.valor;
    case "menorQue":
      return typeof atual === "number" && typeof c.valor === "number" && atual < c.valor;
    case "em":
      return Array.isArray(c.valor) && c.valor.includes(atual);
    default:
      return false;
  }
}

/**
 * Avalia uma condição declarativa contra os valores atuais do formulário.
 * Usada tanto pelo renderer (visibilidade) quanto pelo buildZodSchema (obrigatoriedade) — DRY.
 */
export function avaliarCondicao(cond: Condicao | undefined, valores: Valores): boolean {
  if (!cond) return true;
  if ("todas" in cond) return cond.todas.every((c) => avaliarFolha(c, valores));
  if ("alguma" in cond) return cond.alguma.some((c) => avaliarFolha(c, valores));
  return avaliarFolha(cond, valores);
}
