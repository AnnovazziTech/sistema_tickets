"use client";

import type { Condicao, Operador, TipoCampo } from "@/lib/forms/tipos";

const OPERADORES: { valor: Operador; rotulo: string }[] = [
  { valor: "igual", rotulo: "é igual a" },
  { valor: "diferente", rotulo: "é diferente de" },
  { valor: "preenchido", rotulo: "está preenchido" },
  { valor: "vazio", rotulo: "está vazio" },
  { valor: "maiorQue", rotulo: "é maior que" },
  { valor: "menorQue", rotulo: "é menor que" },
];

const SEM_VALOR: Operador[] = ["preenchido", "vazio"];

type CampoRef = { id: string; label: string; tipo: TipoCampo };

const sel = "rounded-[var(--radius-faj)] border border-faj-border bg-white px-2 py-1 text-xs outline-none";

export function EditorCondicao({
  titulo,
  campos,
  valor,
  onChange,
}: {
  titulo: string;
  campos: CampoRef[];
  valor?: Condicao;
  onChange: (c: Condicao | undefined) => void;
}) {
  const folha = valor && !("todas" in valor) && !("alguma" in valor) ? valor : undefined;
  const ativo = !!folha;
  const alvo = campos.find((c) => c.id === folha?.campo);
  const alvoBool = alvo?.tipo === "simNao" || alvo?.tipo === "toggle";

  function atualizar(patch: Partial<{ campo: string; operador: Operador; valor: unknown }>) {
    const base = folha ?? { campo: campos[0]?.id ?? "", operador: "igual" as Operador, valor: true };
    onChange({ ...base, ...patch });
  }

  return (
    <div className="rounded-[var(--radius-faj)] border border-faj-border p-2">
      <label className="flex items-center gap-2 text-xs font-semibold text-faj-texto">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => (e.target.checked ? atualizar({}) : onChange(undefined))}
          className="accent-faj-azul"
        />
        {titulo}
      </label>

      {ativo && folha && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <select
            value={folha.campo}
            onChange={(e) => atualizar({ campo: e.target.value })}
            className={sel}
          >
            {campos.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <select
            value={folha.operador}
            onChange={(e) => atualizar({ operador: e.target.value as Operador })}
            className={sel}
          >
            {OPERADORES.map((o) => (
              <option key={o.valor} value={o.valor}>{o.rotulo}</option>
            ))}
          </select>
          {!SEM_VALOR.includes(folha.operador) &&
            (alvoBool ? (
              <select
                value={String(folha.valor)}
                onChange={(e) => atualizar({ valor: e.target.value === "true" })}
                className={sel}
              >
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            ) : (
              <input
                value={String(folha.valor ?? "")}
                onChange={(e) => atualizar({ valor: e.target.value })}
                placeholder="valor"
                className={`${sel} w-28`}
              />
            ))}
        </div>
      )}
    </div>
  );
}
