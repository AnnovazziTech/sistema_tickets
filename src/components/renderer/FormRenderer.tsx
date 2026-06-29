"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, Send, Ticket } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { CampoDinamico } from "@/components/renderer/CampoDinamico";
import { avaliarCondicao } from "@/lib/forms/avaliarCondicao";
import { buildZodSchema } from "@/lib/forms/buildZodSchema";
import { camposDeDados, type Campo, type FormDef } from "@/lib/forms/tipos";
import type { Catalogos } from "@/lib/catalogos-shared";

const GRID: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
};
const SPAN_FULL: Record<number, string> = { 1: "", 2: "sm:col-span-2", 3: "sm:col-span-3" };

function valorInicial(campo: Campo): unknown {
  if (campo.default !== undefined) return campo.default;
  switch (campo.tipo) {
    case "numero":
    case "moeda":
    case "simNao":
      return null;
    case "toggle":
      return false;
    case "multiselect":
    case "checkboxes":
    case "upload":
      return [];
    case "cabecalho":
    case "banner":
    case "divisor":
      return undefined;
    default:
      return "";
  }
}

type Resultado = { protocolo: string; emailEnviado?: boolean; destinatarios?: string };
type Valores = Record<string, unknown>;

export function FormRenderer({
  def,
  catalogos,
  action,
  somentePreview = false,
}: {
  def: FormDef;
  catalogos: Catalogos;
  action: string;
  somentePreview?: boolean;
}) {
  const inicial = useMemo<Valores>(() => {
    const v: Valores = {};
    for (const c of camposDeDados(def)) v[c.id] = valorInicial(c);
    return v;
  }, [def]);

  const [valores, setValores] = useState<Valores>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  function set(id: string, valor: unknown) {
    setValores((p) => ({ ...p, [id]: valor }));
    setErros((p) => {
      if (!p[id]) return p;
      const n = { ...p };
      delete n[id];
      return n;
    });
  }

  function visivel(campo: Campo, v: Valores) {
    return avaliarCondicao(campo.visivelQuando, v);
  }
  function obrigatorio(campo: Campo, v: Valores) {
    return campo.obrigatorio === true || (!!campo.obrigatorioQuando && avaliarCondicao(campo.obrigatorioQuando, v));
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (somentePreview) return;
    setErroServidor(null);

    // Considera apenas campos de dados visíveis (descarta valores de campos ocultos).
    const payload: Valores = {};
    for (const c of camposDeDados(def)) {
      if (visivel(c, valores)) payload[c.id] = valores[c.id];
    }

    const parsed = buildZodSchema(def).safeParse(payload);
    if (!parsed.success) {
      const novos: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string" && !novos[k]) novos[k] = issue.message;
      }
      setErros(novos);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) {
        if (Array.isArray(json?.issues)) {
          const novos: Record<string, string> = {};
          for (const issue of json.issues) {
            const k = issue.path?.[0];
            if (typeof k === "string" && !novos[k]) novos[k] = issue.message;
          }
          setErros(novos);
        }
        setErroServidor(json?.error ?? "Não foi possível registrar a solicitação.");
        return;
      }
      setResultado({
        protocolo: json.protocolo,
        emailEnviado: json.emailEnviado,
        destinatarios: json.destinatarios,
      });
    } catch {
      setErroServidor("Falha de conexão. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() {
    setValores(inicial);
    setErros({});
    setErroServidor(null);
    setResultado(null);
  }

  if (resultado) {
    return (
      <div>
        <PageHeader titulo="Solicitação registrada" subtitulo="Seu ticket foi aberto com sucesso." icone={Ticket} />
        <Card className="border-l-4 border-faj-sucesso">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-faj-sucesso/10 text-faj-sucesso">
              <BadgeCheck size={20} />
            </span>
            <div>
              <p className="text-sm text-faj-texto">
                Ticket aberto com o protocolo{" "}
                <strong className="font-mono text-faj-azul">{resultado.protocolo}</strong>.
              </p>
              {resultado.emailEnviado !== undefined && (
                <p className="mt-1 text-sm text-faj-texto-dim">
                  {resultado.emailEnviado
                    ? `Os responsáveis foram notificados por e-mail${resultado.destinatarios ? ` (${resultado.destinatarios})` : ""}.`
                    : "Ticket registrado. O e-mail de notificação não pôde ser enviado agora."}
                </p>
              )}
              <button
                type="button"
                onClick={reiniciar}
                className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-faj)] bg-faj-azul px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-faj-azul-medio"
              >
                Nova solicitação
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titulo={def.titulo} subtitulo={def.descricao} icone={Ticket} />

      {def.avisos?.map((a, i) => (
        <div
          key={i}
          className={`mb-5 flex items-start gap-3 rounded-[var(--radius-faj)] border p-4 ${
            a.tipo === "alerta"
              ? "border-faj-laranja/40 bg-faj-laranja/10"
              : a.tipo === "sucesso"
                ? "border-faj-sucesso/40 bg-faj-sucesso/10"
                : "border-faj-azul-medio/40 bg-faj-azul-medio/10"
          }`}
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-faj-laranja" />
          <p className="text-sm text-faj-texto">{a.texto}</p>
        </div>
      ))}

      <form onSubmit={enviar} noValidate className="space-y-4">
        {def.secoes.map((secao) => {
          const colunas = secao.colunas ?? 1;
          const camposVisiveis = secao.campos.filter((c) => visivel(c, valores));
          if (camposVisiveis.length === 0) return null;
          return (
            <Card key={secao.id} titulo={secao.titulo} descricao={secao.descricao}>
              <div className={`grid gap-4 ${GRID[colunas]}`}>
                {camposVisiveis.map((campo) => {
                  const ehLayout = ["cabecalho", "banner", "divisor"].includes(campo.tipo);
                  const full = ehLayout || !campo.largura || campo.largura === "full";
                  const span = full ? SPAN_FULL[colunas] : "";
                  return (
                    <div key={campo.id} className={span}>
                      <CampoDinamico
                        campo={campo}
                        valor={valores[campo.id]}
                        erro={erros[campo.id]}
                        obrig={obrigatorio(campo, valores)}
                        onChange={(v) => set(campo.id, v)}
                        catalogos={catalogos}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}

        {erroServidor && (
          <div className="rounded-[var(--radius-faj)] border border-faj-erro/40 bg-faj-erro/10 p-3 text-sm text-faj-erro">
            {erroServidor}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pb-2">
          <p className="mr-auto text-xs text-faj-texto-muted">
            Campos marcados com <span className="text-faj-laranja">*</span> são obrigatórios.
          </p>
          <button
            type="submit"
            disabled={enviando || somentePreview}
            className="inline-flex items-center gap-2 rounded-[var(--radius-faj)] bg-faj-azul px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-faj-azul-medio disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={15} />
            {somentePreview ? "Pré-visualização" : enviando ? "Enviando..." : "Registrar solicitação"}
          </button>
        </div>
      </form>
    </div>
  );
}
