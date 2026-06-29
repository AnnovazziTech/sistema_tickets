"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inp =
  "w-full rounded-[var(--radius-faj)] border border-faj-border bg-white px-2.5 py-1.5 text-sm outline-none focus:border-faj-azul-medio";

const ICONES = ["Users", "Building2", "ShoppingCart", "Headphones", "Calculator", "Cpu", "Network", "Wrench", "Megaphone", "Folder"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function NovoSetor() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("Folder");
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCriando(true);
    try {
      const res = await fetch("/api/setores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, slug: slugify(nome), icone }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Falha ao criar.");
        return;
      }
      setNome("");
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setCriando(false);
    }
  }

  return (
    <form onSubmit={criar} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome do setor (ex.: Comercial)"
        className={`${inp} sm:col-span-2`}
      />
      <select value={icone} onChange={(e) => setIcone(e.target.value)} className={inp}>
        {ICONES.map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={criando || !nome}
        className="rounded-[var(--radius-faj)] bg-faj-azul px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-faj-azul-medio disabled:opacity-60"
      >
        {criando ? "Criando..." : "Criar setor"}
      </button>
      {nome && (
        <p className="text-xs text-faj-texto-muted sm:col-span-4">
          Slug (rota): <span className="font-mono">/{slugify(nome)}</span>
        </p>
      )}
      {erro && <p className="text-sm text-faj-erro sm:col-span-4">{erro}</p>}
    </form>
  );
}
