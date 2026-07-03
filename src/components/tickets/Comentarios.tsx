"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function Comentarios({
  ticketId,
  comentarios,
}: {
  ticketId: string;
  comentarios: { autor: string | null; corpo: string; quando: string }[];
}) {
  const router = useRouter();
  const [corpo, setCorpo] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function comentar(e: React.FormEvent) {
    e.preventDefault();
    if (!corpo.trim()) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corpo }),
      });
      if (res.ok) {
        setCorpo("");
        router.refresh();
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      {comentarios.length > 0 && (
        <ul className="mb-3 space-y-2">
          {comentarios.map((c, i) => (
            <li key={i} className="rounded-[var(--radius-faj)] bg-faj-bg-suave p-2.5 text-sm">
              <p className="text-faj-texto">{c.corpo}</p>
              <p className="mt-1 text-xs text-faj-texto-muted">
                {c.autor ?? "—"} · {c.quando}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={comentar} className="space-y-2">
        <textarea
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          rows={2}
          placeholder="Escreva um comentário..."
          className="w-full rounded-[var(--radius-faj)] border border-faj-border bg-white px-2.5 py-2 text-sm outline-none focus:border-faj-azul-medio"
        />
        <button
          type="submit"
          disabled={enviando || !corpo.trim()}
          className="rounded-[var(--radius-faj)] bg-faj-azul px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-faj-azul-medio disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Comentar"}
        </button>
      </form>
    </div>
  );
}

export function AssumirBtn({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  async function assumir() {
    setCarregando(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assumir`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setCarregando(false);
    }
  }
  return (
    <button
      type="button"
      onClick={assumir}
      disabled={carregando}
      className="w-full rounded-[var(--radius-faj)] border border-faj-border px-3 py-1.5 text-sm font-semibold text-faj-texto hover:bg-faj-bg-suave disabled:opacity-60"
    >
      {carregando ? "..." : "Assumir ticket"}
    </button>
  );
}
