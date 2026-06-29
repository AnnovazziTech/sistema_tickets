"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SetorResumo } from "@/lib/forms/builderRepo";

const inp =
  "w-full rounded-[var(--radius-faj)] border border-faj-border bg-white px-2.5 py-1.5 text-sm outline-none focus:border-faj-azul-medio";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function NovoFormulario({ setores }: { setores: SetorResumo[] }) {
  const router = useRouter();
  const [setorId, setSetorId] = useState(setores[0]?.id ?? "");
  const [nome, setNome] = useState("");
  const [prefixo, setPrefixo] = useState("TKT");
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCriando(true);
    try {
      const res = await fetch("/api/formularios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setorId, nome, slug: slugify(nome), prefixo }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Falha ao criar.");
        return;
      }
      router.push(`/admin/builder/${json.id}`);
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setCriando(false);
    }
  }

  return (
    <form onSubmit={criar} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <select value={setorId} onChange={(e) => setSetorId(e.target.value)} className={inp}>
        {setores.map((s) => (
          <option key={s.id} value={s.id}>{s.nome}</option>
        ))}
      </select>
      <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do formulário" className={`${inp} sm:col-span-2`} />
      <input value={prefixo} onChange={(e) => setPrefixo(e.target.value.toUpperCase())} placeholder="Prefixo (ex.: MOV)" className={inp} />
      {erro && <p className="text-sm text-faj-erro sm:col-span-4">{erro}</p>}
      <div className="sm:col-span-4">
        <button
          type="submit"
          disabled={criando || !nome || !setorId}
          className="rounded-[var(--radius-faj)] bg-faj-azul px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-faj-azul-medio disabled:opacity-60"
        >
          {criando ? "Criando..." : "Criar e editar"}
        </button>
      </div>
    </form>
  );
}
