"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import type { Opcao } from "@/lib/forms/tipos";

const labelCls =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-faj-texto-dim";
const inputBase =
  "w-full rounded-[var(--radius-faj)] border bg-white px-2.5 py-2 text-sm outline-none transition-colors focus:border-faj-azul-medio";

function borda(erro?: string) {
  return erro ? "border-faj-erro" : "border-faj-border";
}

/* ---------- Wrapper de campo (label + obrigatório + erro + dica) ---------- */
export function Campo({
  label,
  obrig,
  erro,
  dica,
  htmlFor,
  children,
}: {
  label: string;
  obrig?: boolean;
  erro?: string;
  dica?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
        {obrig && <span className="ml-0.5 text-faj-laranja">*</span>}
      </label>
      {children}
      {dica && !erro && <p className="mt-1 text-xs text-faj-texto-muted">{dica}</p>}
      {erro && <p className="mt-1 text-xs font-medium text-faj-erro">{erro}</p>}
    </div>
  );
}

/* ---------- Texto (com datalist opcional) ---------- */
export function TextInput({
  label,
  value,
  onChange,
  obrig,
  erro,
  dica,
  placeholder,
  opcoes,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  obrig?: boolean;
  erro?: string;
  dica?: ReactNode;
  placeholder?: string;
  opcoes?: string[];
}) {
  const id = useId();
  const listId = opcoes && opcoes.length ? `${id}-list` : undefined;
  return (
    <Campo label={label} obrig={obrig} erro={erro} dica={dica} htmlFor={id}>
      <input
        id={id}
        type="text"
        value={value}
        list={listId}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} ${borda(erro)}`}
      />
      {listId && (
        <datalist id={listId}>
          {opcoes!.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
    </Campo>
  );
}

/* ---------- Valor monetário (R$, formato pt-BR) ---------- */
export function CurrencyInput({
  label,
  value,
  onChange,
  obrig,
  erro,
  dica,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  obrig?: boolean;
  erro?: string;
  dica?: ReactNode;
}) {
  const id = useId();
  const display =
    value == null
      ? ""
      : value.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(digits ? Number(digits) / 100 : null);
  }

  return (
    <Campo label={label} obrig={obrig} erro={erro} dica={dica} htmlFor={id}>
      <div
        className={`flex items-center rounded-[var(--radius-faj)] border bg-white px-2.5 ${borda(erro)} focus-within:border-faj-azul-medio`}
      >
        <span className="mr-1.5 text-sm text-faj-texto-muted">R$</span>
        <input
          id={id}
          inputMode="decimal"
          value={display}
          placeholder="0,00"
          onChange={handle}
          className="w-full bg-transparent py-2 text-sm outline-none"
        />
      </div>
    </Campo>
  );
}

/* ---------- Sim / Não (segmentado) ---------- */
export function SimNao({
  label,
  value,
  onChange,
  obrig,
  erro,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  obrig?: boolean;
  erro?: string;
}) {
  const opcoes: { rotulo: string; val: boolean }[] = [
    { rotulo: "Sim", val: true },
    { rotulo: "Não", val: false },
  ];
  return (
    <Campo label={label} obrig={obrig} erro={erro}>
      <div className="inline-flex rounded-[var(--radius-faj)] border border-faj-border p-0.5">
        {opcoes.map((o) => {
          const ativo = value === o.val;
          return (
            <button
              key={o.rotulo}
              type="button"
              onClick={() => onChange(o.val)}
              aria-pressed={ativo}
              className={`min-w-[64px] rounded-[3px] px-4 py-1.5 text-sm font-semibold transition-colors ${
                ativo
                  ? o.val
                    ? "bg-faj-azul text-white"
                    : "bg-faj-texto-dim text-white"
                  : "text-faj-texto-dim hover:bg-faj-bg-suave"
              }`}
            >
              {o.rotulo}
            </button>
          );
        })}
      </div>
    </Campo>
  );
}

/* ---------- Competência (mês, sem dia) ---------- */
export function MonthInput({
  label,
  value,
  onChange,
  obrig,
  erro,
  dica,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  obrig?: boolean;
  erro?: string;
  dica?: ReactNode;
  min?: string;
}) {
  const id = useId();
  return (
    <Campo label={label} obrig={obrig} erro={erro} dica={dica} htmlFor={id}>
      <input
        id={id}
        type="month"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} ${borda(erro)} max-w-[220px]`}
      />
    </Campo>
  );
}

/* ---------- Texto longo ---------- */
export function TextArea({
  label, value, onChange, obrig, erro, dica, placeholder, linhas = 3,
}: {
  label: string; value: string; onChange: (v: string) => void;
  obrig?: boolean; erro?: string; dica?: ReactNode; placeholder?: string; linhas?: number;
}) {
  const id = useId();
  return (
    <Campo label={label} obrig={obrig} erro={erro} dica={dica} htmlFor={id}>
      <textarea
        id={id}
        value={value}
        rows={linhas}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} ${borda(erro)}`}
      />
    </Campo>
  );
}

/* ---------- Número ---------- */
export function NumberInput({
  label, value, onChange, obrig, erro, dica, placeholder, min, max, passo,
}: {
  label: string; value: number | null; onChange: (v: number | null) => void;
  obrig?: boolean; erro?: string; dica?: ReactNode; placeholder?: string;
  min?: number; max?: number; passo?: number;
}) {
  const id = useId();
  return (
    <Campo label={label} obrig={obrig} erro={erro} dica={dica} htmlFor={id}>
      <input
        id={id}
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={passo}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={`${inputBase} ${borda(erro)}`}
      />
    </Campo>
  );
}

/* ---------- Data / Data-hora ---------- */
export function DateInput({
  label, value, onChange, obrig, erro, dica, min, max, tipo = "date",
}: {
  label: string; value: string; onChange: (v: string) => void;
  obrig?: boolean; erro?: string; dica?: ReactNode; min?: string; max?: string;
  tipo?: "date" | "datetime-local";
}) {
  const id = useId();
  return (
    <Campo label={label} obrig={obrig} erro={erro} dica={dica} htmlFor={id}>
      <input
        id={id}
        type={tipo}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} ${borda(erro)} max-w-[260px]`}
      />
    </Campo>
  );
}

/* ---------- Select (lista) ---------- */
export function Select({
  label, value, onChange, opcoes, obrig, erro, dica, placeholder = "Selecione...",
}: {
  label: string; value: string; onChange: (v: string) => void; opcoes: Opcao[];
  obrig?: boolean; erro?: string; dica?: ReactNode; placeholder?: string;
}) {
  const id = useId();
  return (
    <Campo label={label} obrig={obrig} erro={erro} dica={dica} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} ${borda(erro)}`}
      >
        <option value="">{placeholder}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>{o.rotulo}</option>
        ))}
      </select>
    </Campo>
  );
}

/* ---------- Radio ---------- */
export function RadioGroup({
  label, value, onChange, opcoes, obrig, erro,
}: {
  label: string; value: string; onChange: (v: string) => void; opcoes: Opcao[];
  obrig?: boolean; erro?: string;
}) {
  return (
    <Campo label={label} obrig={obrig} erro={erro}>
      <div className="flex flex-col gap-1.5 pt-0.5">
        {opcoes.map((o) => (
          <label key={o.valor} className="flex cursor-pointer items-center gap-2 text-sm text-faj-texto">
            <input
              type="radio"
              checked={value === o.valor}
              onChange={() => onChange(o.valor)}
              className="accent-faj-azul"
            />
            {o.rotulo}
          </label>
        ))}
      </div>
    </Campo>
  );
}

/* ---------- Caixas (múltipla) ---------- */
export function CheckboxGroup({
  label, value, onChange, opcoes, obrig, erro,
}: {
  label: string; value: string[]; onChange: (v: string[]) => void; opcoes: Opcao[];
  obrig?: boolean; erro?: string;
}) {
  function toggle(val: string) {
    onChange(value.includes(val) ? value.filter((x) => x !== val) : [...value, val]);
  }
  return (
    <Campo label={label} obrig={obrig} erro={erro}>
      <div className="flex flex-col gap-1.5 pt-0.5">
        {opcoes.map((o) => (
          <label key={o.valor} className="flex cursor-pointer items-center gap-2 text-sm text-faj-texto">
            <input
              type="checkbox"
              checked={value.includes(o.valor)}
              onChange={() => toggle(o.valor)}
              className="accent-faj-azul"
            />
            {o.rotulo}
          </label>
        ))}
      </div>
    </Campo>
  );
}

/* ---------- Multiselect (lista nativa múltipla) ---------- */
export function MultiSelect({
  label, value, onChange, opcoes, obrig, erro, dica,
}: {
  label: string; value: string[]; onChange: (v: string[]) => void; opcoes: Opcao[];
  obrig?: boolean; erro?: string; dica?: ReactNode;
}) {
  const id = useId();
  return (
    <Campo label={label} obrig={obrig} erro={erro} dica={dica} htmlFor={id}>
      <select
        id={id}
        multiple
        value={value}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
        className={`${inputBase} ${borda(erro)} min-h-[88px]`}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>{o.rotulo}</option>
        ))}
      </select>
    </Campo>
  );
}

/* ---------- Interruptor (toggle) ---------- */
export function Toggle({
  label, value, onChange, erro,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void; erro?: string;
}) {
  return (
    <Campo label={label} erro={erro}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-faj-azul" : "bg-faj-texto-muted/40"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </Campo>
  );
}

/* ---------- Texto com máscara (telefone / CPF-CNPJ) ---------- */
export function MaskedInput({
  label, value, onChange, mascara, obrig, erro, dica, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  mascara: "telefone" | "cpfCnpj";
  obrig?: boolean; erro?: string; dica?: ReactNode; placeholder?: string;
}) {
  const id = useId();
  const fmt = mascara === "telefone" ? mascararTelefone : mascararCpfCnpj;
  return (
    <Campo label={label} obrig={obrig} erro={erro} dica={dica} htmlFor={id}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        placeholder={placeholder ?? (mascara === "telefone" ? "(00) 00000-0000" : "CPF ou CNPJ")}
        onChange={(e) => onChange(fmt(e.target.value))}
        className={`${inputBase} ${borda(erro)}`}
      />
    </Campo>
  );
}

function mascararTelefone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{0,2})/, "($1");
  if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function mascararCpfCnpj(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/* ---------- Componentes de layout (não geram resposta) ---------- */
export function Cabecalho({ texto }: { texto: string }) {
  return <h3 className="border-b border-faj-border pb-1 text-sm font-bold text-faj-azul">{texto}</h3>;
}

export function BannerCampo({
  texto, tom = "info",
}: {
  texto: string; tom?: "info" | "alerta" | "sucesso";
}) {
  const cores: Record<string, string> = {
    info: "border-faj-azul-medio/40 bg-faj-azul-medio/10 text-faj-texto",
    alerta: "border-faj-laranja/40 bg-faj-laranja/10 text-faj-texto",
    sucesso: "border-faj-sucesso/40 bg-faj-sucesso/10 text-faj-texto",
  };
  return <div className={`rounded-[var(--radius-faj)] border p-3 text-sm ${cores[tom]}`}>{texto}</div>;
}

export function Divisor() {
  return <hr className="border-faj-border" />;
}
