"use client";

import {
  BannerCampo,
  Cabecalho,
  Campo,
  CheckboxGroup,
  CurrencyInput,
  DateInput,
  Divisor,
  MaskedInput,
  MonthInput,
  MultiSelect,
  NumberInput,
  RadioGroup,
  Select,
  SimNao,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/form-fields";
import type { Campo as CampoDef, Opcao } from "@/lib/forms/tipos";
import { listaCatalogo, type Catalogos } from "@/lib/catalogos-shared";

function opcoesDoCampo(campo: CampoDef, catalogos: Catalogos): Opcao[] {
  if (campo.catalogo) {
    return listaCatalogo(catalogos, campo.catalogo).map((v) => ({ valor: v, rotulo: v }));
  }
  return campo.opcoes ?? [];
}

export function CampoDinamico({
  campo,
  valor,
  erro,
  obrig,
  onChange,
  catalogos,
}: {
  campo: CampoDef;
  valor: unknown;
  erro?: string;
  obrig: boolean;
  onChange: (v: unknown) => void;
  catalogos: Catalogos;
}) {
  const comum = { label: campo.label, obrig, erro, dica: campo.dica, placeholder: campo.placeholder };

  switch (campo.tipo) {
    case "texto":
    case "email":
      return (
        <TextInput
          {...comum}
          value={(valor as string) ?? ""}
          onChange={onChange}
        />
      );
    case "lookup":
      return (
        <TextInput
          {...comum}
          value={(valor as string) ?? ""}
          onChange={onChange}
          opcoes={listaCatalogo(catalogos, campo.catalogo)}
        />
      );
    case "textarea":
      return (
        <TextArea
          {...comum}
          linhas={campo.linhas}
          value={(valor as string) ?? ""}
          onChange={onChange}
        />
      );
    case "numero":
      return (
        <NumberInput
          {...comum}
          min={campo.min}
          max={campo.max}
          passo={campo.passo}
          value={(valor as number | null) ?? null}
          onChange={onChange}
        />
      );
    case "moeda":
      return (
        <CurrencyInput
          {...comum}
          value={(valor as number | null) ?? null}
          onChange={onChange}
        />
      );
    case "mes":
      return (
        <MonthInput
          {...comum}
          value={(valor as string) ?? ""}
          onChange={onChange}
        />
      );
    case "data":
      return (
        <DateInput
          {...comum}
          tipo="date"
          value={(valor as string) ?? ""}
          onChange={onChange}
        />
      );
    case "dataHora":
      return (
        <DateInput
          {...comum}
          tipo="datetime-local"
          value={(valor as string) ?? ""}
          onChange={onChange}
        />
      );
    case "telefone":
      return (
        <MaskedInput
          {...comum}
          mascara="telefone"
          value={(valor as string) ?? ""}
          onChange={onChange}
        />
      );
    case "cpfCnpj":
      return (
        <MaskedInput
          {...comum}
          mascara="cpfCnpj"
          value={(valor as string) ?? ""}
          onChange={onChange}
        />
      );
    case "select":
      return (
        <Select
          {...comum}
          opcoes={opcoesDoCampo(campo, catalogos)}
          value={(valor as string) ?? ""}
          onChange={onChange}
        />
      );
    case "multiselect":
      return (
        <MultiSelect
          {...comum}
          opcoes={opcoesDoCampo(campo, catalogos)}
          value={(valor as string[]) ?? []}
          onChange={onChange}
        />
      );
    case "radio":
      return (
        <RadioGroup
          label={campo.label}
          obrig={obrig}
          erro={erro}
          opcoes={opcoesDoCampo(campo, catalogos)}
          value={(valor as string) ?? ""}
          onChange={onChange}
        />
      );
    case "checkboxes":
      return (
        <CheckboxGroup
          label={campo.label}
          obrig={obrig}
          erro={erro}
          opcoes={opcoesDoCampo(campo, catalogos)}
          value={(valor as string[]) ?? []}
          onChange={onChange}
        />
      );
    case "simNao":
      return (
        <SimNao
          label={campo.label}
          obrig={obrig}
          erro={erro}
          value={(valor as boolean | null) ?? null}
          onChange={onChange}
        />
      );
    case "toggle":
      return (
        <Toggle
          label={campo.label}
          erro={erro}
          value={Boolean(valor)}
          onChange={onChange}
        />
      );
    case "upload":
      return (
        <Campo label={campo.label} obrig={obrig} erro={erro} dica={campo.dica}>
          <input
            type="file"
            multiple={campo.multiplo}
            accept={campo.aceita}
            onChange={(e) =>
              onChange(
                Array.from(e.target.files ?? []).map((f) => ({ nome: f.name, tamanho: f.size })),
              )
            }
            className="block w-full text-sm text-faj-texto-dim file:mr-3 file:rounded-[var(--radius-faj)] file:border-0 file:bg-faj-azul file:px-3 file:py-1.5 file:text-white"
          />
          {Array.isArray(valor) && valor.length > 0 && (
            <p className="mt-1 text-xs text-faj-texto-muted">
              {(valor as { nome: string }[]).map((a) => a.nome).join(", ")}
            </p>
          )}
        </Campo>
      );
    case "somenteLeitura":
      return (
        <Campo label={campo.label}>
          <p className="rounded-[var(--radius-faj)] bg-faj-bg-suave px-2.5 py-2 text-sm text-faj-texto-dim">
            {campo.conteudo ?? "—"}
          </p>
        </Campo>
      );
    case "cabecalho":
      return <Cabecalho texto={campo.conteudo ?? campo.label} />;
    case "banner":
      return <BannerCampo texto={campo.conteudo ?? campo.label} tom={campo.tomBanner} />;
    case "divisor":
      return <Divisor />;
    default:
      return null;
  }
}
