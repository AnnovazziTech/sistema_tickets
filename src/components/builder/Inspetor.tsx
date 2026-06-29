"use client";

import { Trash2 } from "lucide-react";
import type { Campo, FonteCatalogo, Largura, Opcao } from "@/lib/forms/tipos";
import { POR_TIPO } from "@/lib/forms/catalogoComponentes";
import { EditorCondicao } from "./EditorCondicao";

const lbl = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-faj-texto-dim";
const inp =
  "w-full rounded-[var(--radius-faj)] border border-faj-border bg-white px-2.5 py-1.5 text-sm outline-none focus:border-faj-azul-medio";

type CampoRef = { id: string; label: string; tipo: Campo["tipo"] };

export function Inspetor({
  campo,
  camposCondicao,
  onChange,
  onRemove,
}: {
  campo: Campo;
  camposCondicao: CampoRef[];
  onChange: (patch: Partial<Campo>) => void;
  onRemove: () => void;
}) {
  const meta = POR_TIPO[campo.tipo];

  function setOpcao(i: number, rotulo: string) {
    const opcoes = [...(campo.opcoes ?? [])];
    opcoes[i] = { valor: rotulo, rotulo };
    onChange({ opcoes });
  }
  function addOpcao() {
    const n = (campo.opcoes?.length ?? 0) + 1;
    onChange({ opcoes: [...(campo.opcoes ?? []), { valor: `Opção ${n}`, rotulo: `Opção ${n}` }] });
  }
  function removeOpcao(i: number) {
    onChange({ opcoes: (campo.opcoes ?? []).filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="rounded bg-faj-azul/10 px-2 py-0.5 text-[11px] font-semibold text-faj-azul">
          {meta?.rotulo ?? campo.tipo}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 text-xs font-medium text-faj-erro hover:underline"
        >
          <Trash2 size={12} /> Remover
        </button>
      </div>

      <div>
        <label className={lbl}>Rótulo</label>
        <input value={campo.label} onChange={(e) => onChange({ label: e.target.value })} className={inp} />
      </div>

      <p className="text-[11px] text-faj-texto-muted">
        ID (chave da resposta): <span className="font-mono">{campo.id}</span>
      </p>

      {!meta?.layout && (
        <>
          <label className="flex items-center gap-2 text-sm text-faj-texto">
            <input
              type="checkbox"
              checked={campo.obrigatorio ?? false}
              onChange={(e) => onChange({ obrigatorio: e.target.checked })}
              className="accent-faj-azul"
            />
            Obrigatório
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Largura</label>
              <select
                value={campo.largura ?? "full"}
                onChange={(e) => onChange({ largura: e.target.value as Largura })}
                className={inp}
              >
                <option value="full">Inteira</option>
                <option value="half">Metade</option>
                <option value="third">Um terço</option>
              </select>
            </div>
            {meta?.temCatalogo && (
              <div>
                <label className={lbl}>Catálogo (fonte)</label>
                <select
                  value={campo.catalogo ?? ""}
                  onChange={(e) =>
                    onChange({ catalogo: (e.target.value || undefined) as FonteCatalogo | undefined })
                  }
                  className={inp}
                >
                  <option value="">— nenhum —</option>
                  <option value="cargos">Cargos</option>
                  <option value="unidades">Unidades</option>
                  <option value="funcionarios">Funcionários</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className={lbl}>Placeholder</label>
            <input
              value={campo.placeholder ?? ""}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Dica</label>
            <input value={campo.dica ?? ""} onChange={(e) => onChange({ dica: e.target.value })} className={inp} />
          </div>
        </>
      )}

      {meta?.temOpcoes && (
        <div>
          <label className={lbl}>Opções</label>
          <div className="space-y-1">
            {(campo.opcoes ?? []).map((o: Opcao, i: number) => (
              <div key={i} className="flex items-center gap-1">
                <input value={o.rotulo} onChange={(e) => setOpcao(i, e.target.value)} className={`${inp} py-1`} />
                <button type="button" onClick={() => removeOpcao(i)} className="text-faj-erro">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addOpcao} className="mt-1 text-xs font-semibold text-faj-azul-medio hover:underline">
            + Adicionar opção
          </button>
        </div>
      )}

      {meta?.layout && campo.tipo !== "divisor" && (
        <>
          <div>
            <label className={lbl}>Conteúdo</label>
            <textarea
              value={campo.conteudo ?? ""}
              onChange={(e) => onChange({ conteudo: e.target.value })}
              rows={2}
              className={inp}
            />
          </div>
          {campo.tipo === "banner" && (
            <div>
              <label className={lbl}>Tom</label>
              <select
                value={campo.tomBanner ?? "info"}
                onChange={(e) => onChange({ tomBanner: e.target.value as "info" | "alerta" | "sucesso" })}
                className={inp}
              >
                <option value="info">Informação</option>
                <option value="alerta">Alerta</option>
                <option value="sucesso">Sucesso</option>
              </select>
            </div>
          )}
        </>
      )}

      {!meta?.layout && (
        <div className="space-y-2 border-t border-faj-border pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-faj-texto-muted">Regras</p>
          <EditorCondicao
            titulo="Mostrar só quando..."
            campos={camposCondicao}
            valor={campo.visivelQuando}
            onChange={(c) => onChange({ visivelQuando: c })}
          />
          <EditorCondicao
            titulo="Obrigatório só quando..."
            campos={camposCondicao}
            valor={campo.obrigatorioQuando}
            onChange={(c) => onChange({ obrigatorioQuando: c })}
          />
        </div>
      )}
    </div>
  );
}
