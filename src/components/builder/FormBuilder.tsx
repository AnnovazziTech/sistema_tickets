"use client";

import { useState } from "react";
import { Plus, Save, Send, Trash2 } from "lucide-react";
import { Paleta } from "./Paleta";
import { Inspetor } from "./Inspetor";
import { FormRenderer } from "@/components/renderer/FormRenderer";
import { POR_TIPO } from "@/lib/forms/catalogoComponentes";
import { CATALOGOS_VAZIO } from "@/lib/catalogos-shared";
import type { Campo, FormDef, Secao, TipoCampo } from "@/lib/forms/tipos";

function genId(def: FormDef): string {
  const ids = new Set(def.secoes.flatMap((s) => s.campos.map((c) => c.id)));
  let n = 1;
  while (ids.has(`campo_${n}`)) n++;
  return `campo_${n}`;
}

function novoCampo(def: FormDef, tipo: TipoCampo): Campo {
  const meta = POR_TIPO[tipo];
  const c: Campo = { id: genId(def), tipo, label: meta.rotulo };
  if (meta.temOpcoes)
    c.opcoes = [
      { valor: "Opção 1", rotulo: "Opção 1" },
      { valor: "Opção 2", rotulo: "Opção 2" },
    ];
  if (tipo === "banner") {
    c.conteudo = "Texto do aviso";
    c.tomBanner = "info";
  }
  if (tipo === "cabecalho") c.conteudo = "Título";
  return c;
}

export function FormBuilder({
  formularioId,
  nome,
  setorNome,
  defInicial,
}: {
  formularioId: number | null;
  nome: string;
  setorNome: string;
  defInicial: FormDef;
}) {
  const [def, setDef] = useState<FormDef>(defInicial);
  const [secaoSel, setSecaoSel] = useState(0);
  const [sel, setSel] = useState<{ s: number; c: number } | null>(null);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const podePersistir = formularioId != null;

  function mut(fn: (d: FormDef) => void) {
    setDef((prev) => {
      const n = structuredClone(prev) as FormDef;
      fn(n);
      return n;
    });
  }

  function addCampo(tipo: TipoCampo) {
    mut((d) => {
      if (!d.secoes[secaoSel]) return;
      d.secoes[secaoSel].campos.push(novoCampo(d, tipo));
    });
  }
  function patchCampo(s: number, c: number, patch: Partial<Campo>) {
    mut((d) => Object.assign(d.secoes[s].campos[c], patch));
  }
  function removeCampo(s: number, c: number) {
    mut((d) => d.secoes[s].campos.splice(c, 1));
    setSel(null);
  }
  function moveCampo(s: number, c: number, dir: -1 | 1) {
    mut((d) => {
      const arr = d.secoes[s].campos;
      const j = c + dir;
      if (j < 0 || j >= arr.length) return;
      [arr[c], arr[j]] = [arr[j], arr[c]];
    });
    setSel(null);
  }
  function addSecao() {
    mut((d) => d.secoes.push({ id: `secao${d.secoes.length + 1}`, titulo: "Nova seção", colunas: 2, campos: [] }));
  }
  function patchSecao(s: number, patch: Partial<Secao>) {
    mut((d) => Object.assign(d.secoes[s], patch));
  }
  function removeSecao(s: number) {
    mut((d) => d.secoes.splice(s, 1));
    setSecaoSel(0);
    setSel(null);
  }

  async function persistir(publicar: boolean) {
    if (!podePersistir) {
      setMsg("Modo demonstração — configure DATABASE_URL para salvar.");
      return;
    }
    setSalvando(true);
    setMsg(null);
    try {
      const url = publicar ? `/api/formularios/${formularioId}/publicar` : `/api/formularios/${formularioId}`;
      const res = await fetch(url, {
        method: publicar ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ def }),
      });
      const json = await res.json();
      setMsg(res.ok ? (publicar ? "Formulário publicado!" : "Rascunho salvo.") : json.error || "Falha ao salvar.");
    } catch {
      setMsg("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  const campoSel = sel ? def.secoes[sel.s]?.campos[sel.c] : undefined;
  const camposCondicao = def.secoes
    .flatMap((s) => s.campos)
    .filter((c) => !POR_TIPO[c.tipo].layout && c.id !== campoSel?.id)
    .map((c) => ({ id: c.id, label: c.label, tipo: c.tipo }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-lg font-bold text-faj-azul">{nome}</h1>
          <p className="text-sm text-faj-texto-dim">
            Setor: {setorNome}
            {!podePersistir && " · modo demonstração (sem banco)"}
          </p>
        </div>
        {msg && <span className="text-xs font-medium text-faj-azul-medio">{msg}</span>}
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="rounded-[var(--radius-faj)] border border-faj-border px-3 py-1.5 text-sm font-semibold text-faj-texto hover:bg-faj-bg-suave"
        >
          {preview ? "← Editar" : "Pré-visualizar"}
        </button>
        <button
          type="button"
          disabled={salvando}
          onClick={() => persistir(false)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-faj)] border border-faj-border px-3 py-1.5 text-sm font-semibold text-faj-texto hover:bg-faj-bg-suave disabled:opacity-60"
        >
          <Save size={14} /> Salvar rascunho
        </button>
        <button
          type="button"
          disabled={salvando}
          onClick={() => persistir(true)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-faj)] bg-faj-azul px-3 py-1.5 text-sm font-semibold text-white hover:bg-faj-azul-medio disabled:opacity-60"
        >
          <Send size={14} /> Publicar
        </button>
      </div>

      {preview ? (
        <div className="card-faj p-5">
          <FormRenderer def={def} catalogos={CATALOGOS_VAZIO} action="#preview" somentePreview />
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Paleta */}
          <aside className="w-52 shrink-0 card-faj p-3">
            <Paleta onAdd={addCampo} />
          </aside>

          {/* Canvas */}
          <div className="flex-1 space-y-3">
            {def.secoes.map((secao, s) => (
              <div
                key={secao.id}
                className={`card-faj p-3 ${secaoSel === s ? "ring-1 ring-faj-azul-medio" : ""}`}
                onClick={() => setSecaoSel(s)}
              >
                <div className="mb-2 flex items-center gap-2">
                  <input
                    value={secao.titulo ?? ""}
                    onChange={(e) => patchSecao(s, { titulo: e.target.value })}
                    placeholder="Título da seção"
                    className="flex-1 rounded-[var(--radius-faj)] border border-faj-border px-2 py-1 text-sm font-semibold outline-none"
                  />
                  <select
                    value={secao.colunas ?? 1}
                    onChange={(e) => patchSecao(s, { colunas: Number(e.target.value) as 1 | 2 | 3 })}
                    className="rounded-[var(--radius-faj)] border border-faj-border px-1.5 py-1 text-xs"
                  >
                    <option value={1}>1 col</option>
                    <option value={2}>2 col</option>
                    <option value={3}>3 col</option>
                  </select>
                  <button type="button" onClick={() => removeSecao(s)} className="text-faj-erro" title="Remover seção">
                    <Trash2 size={14} />
                  </button>
                </div>

                {secao.campos.length === 0 && (
                  <p className="rounded-[var(--radius-faj)] border border-dashed border-faj-border p-3 text-center text-xs text-faj-texto-muted">
                    Selecione esta seção e clique num componente da paleta.
                  </p>
                )}
                <div className="space-y-1">
                  {secao.campos.map((campo, c) => {
                    const ativo = sel?.s === s && sel?.c === c;
                    return (
                      <div
                        key={campo.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSecaoSel(s);
                          setSel({ s, c });
                        }}
                        className={`flex cursor-pointer items-center gap-2 rounded-[var(--radius-faj)] border px-2 py-1.5 text-sm ${
                          ativo ? "border-faj-azul-medio bg-faj-azul/5" : "border-faj-border hover:bg-faj-bg-suave"
                        }`}
                      >
                        <span className="rounded bg-faj-bg-suave px-1.5 py-0.5 text-[10px] font-semibold text-faj-texto-dim">
                          {POR_TIPO[campo.tipo].rotulo}
                        </span>
                        <span className="truncate text-faj-texto">{campo.label}</span>
                        {campo.obrigatorio && <span className="text-faj-laranja">*</span>}
                        <span className="ml-auto flex items-center gap-1 text-faj-texto-muted">
                          <button type="button" onClick={(e) => { e.stopPropagation(); moveCampo(s, c, -1); }}>↑</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); moveCampo(s, c, 1); }}>↓</button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addSecao}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-faj)] border border-dashed border-faj-border px-3 py-1.5 text-sm font-semibold text-faj-texto-dim hover:bg-faj-bg-suave"
            >
              <Plus size={14} /> Adicionar seção
            </button>
          </div>

          {/* Inspetor */}
          <aside className="w-72 shrink-0 card-faj p-3">
            {campoSel && sel ? (
              <Inspetor
                campo={campoSel}
                camposCondicao={camposCondicao}
                onChange={(patch) => patchCampo(sel.s, sel.c, patch)}
                onRemove={() => removeCampo(sel.s, sel.c)}
              />
            ) : (
              <p className="text-sm text-faj-texto-muted">Selecione um campo para editar suas propriedades.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
