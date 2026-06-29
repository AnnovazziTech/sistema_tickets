import { z } from "zod";
import { avaliarCondicao } from "./avaliarCondicao";
import { camposDeDados, type Campo, type FormDef } from "./tipos";

const RE_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const RE_DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const RE_DATAHORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const anexoSchema = z.object({
  nome: z.string(),
  url: z.string().optional(),
  tamanho: z.number().optional(),
});

/**
 * Base permissiva por tipo: nunca falha por vazio (a obrigatoriedade é feita no superRefine,
 * garantindo que ele sempre rode). Quando há valor, valida o formato.
 */
function baseDoTipo(campo: Campo): z.ZodTypeAny {
  const vazioOk = <T extends z.ZodTypeAny>(s: T) => s.nullable().optional();
  switch (campo.tipo) {
    case "numero":
    case "moeda":
      return vazioOk(z.number());
    case "simNao":
    case "toggle":
      return vazioOk(z.boolean());
    case "email":
      return z.union([z.literal(""), z.string().trim().email("E-mail inválido.")]).optional();
    case "mes":
      return z.union([z.literal(""), z.string().regex(RE_MES, "Mês inválido.")]).optional();
    case "data":
      return z.union([z.literal(""), z.string().regex(RE_DATA, "Data inválida.")]).optional();
    case "dataHora":
      return z.union([z.literal(""), z.string().regex(RE_DATAHORA, "Data/hora inválida.")]).optional();
    case "multiselect":
    case "checkboxes":
      return z.array(z.string()).optional();
    case "upload":
      return z.array(anexoSchema).optional();
    default:
      // texto, textarea, select, radio, lookup, telefone, cpfCnpj, somenteLeitura
      return z.string().optional();
  }
}

function estaVazio(valor: unknown): boolean {
  return (
    valor == null ||
    valor === "" ||
    (Array.isArray(valor) && valor.length === 0) ||
    (typeof valor === "string" && valor.trim() === "")
  );
}

/**
 * Gera um schema Zod a partir da definição do formulário. Puro e reutilizável no
 * cliente (pré-submit) e no servidor (API). Toda obrigatoriedade — estática ou
 * condicional (obrigatorioQuando) — é aplicada num único superRefine, respeitando
 * a visibilidade (visivelQuando). Erros saem com path:[campo.id].
 */
export function buildZodSchema(def: FormDef): z.ZodType<Record<string, unknown>> {
  const campos = camposDeDados(def);
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const c of campos) shape[c.id] = baseDoTipo(c);

  return z
    .object(shape)
    .passthrough()
    .superRefine((valores, ctx) => {
      const v = valores as Record<string, unknown>;
      for (const c of campos) {
        const visivel = avaliarCondicao(c.visivelQuando, v);
        if (!visivel) continue; // campo oculto não é validado

        const obrigatorio =
          c.obrigatorio === true ||
          (!!c.obrigatorioQuando && avaliarCondicao(c.obrigatorioQuando, v));

        if (obrigatorio && estaVazio(v[c.id])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [c.id],
            message: mensagemObrigatorio(c),
          });
          continue;
        }

        // Validação de pertinência para escolha única.
        if (
          (c.tipo === "select" || c.tipo === "radio") &&
          !estaVazio(v[c.id]) &&
          c.opcoes &&
          c.opcoes.length > 0 &&
          !c.opcoes.some((o) => o.valor === v[c.id])
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [c.id],
            message: "Opção inválida.",
          });
        }

        // Limite de seleções para múltipla escolha.
        if (
          (c.tipo === "multiselect" || c.tipo === "checkboxes") &&
          c.maxSelecoes &&
          Array.isArray(v[c.id]) &&
          (v[c.id] as unknown[]).length > c.maxSelecoes
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [c.id],
            message: `Selecione no máximo ${c.maxSelecoes}.`,
          });
        }
      }
    });
}

function mensagemObrigatorio(c: Campo): string {
  switch (c.tipo) {
    case "simNao":
    case "toggle":
      return `Selecione uma opção para "${c.label}".`;
    case "select":
    case "radio":
    case "multiselect":
    case "checkboxes":
      return `Selecione ${c.label.toLowerCase()}.`;
    default:
      return `Informe ${c.label.toLowerCase()}.`;
  }
}
