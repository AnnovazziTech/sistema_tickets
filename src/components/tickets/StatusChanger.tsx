"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_VALIDOS, STATUS_ROTULO, type StatusTicket } from "@/lib/tickets/status";

const ctrl =
  "w-full rounded-[var(--radius-faj)] border border-faj-border bg-white px-2.5 py-1.5 text-sm outline-none focus:border-faj-azul-medio";

export function StatusChanger({ ticketId, statusAtual }: { ticketId: string; statusAtual: StatusTicket }) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusTicket>(statusAtual);
  const [comentario, setComentario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function atualizar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comentario }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Falha ao atualizar.");
        return;
      }
      setComentario("");
      router.refresh();
    } catch {
      setMsg("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={atualizar} className="space-y-2">
      <select value={status} onChange={(e) => setStatus(e.target.value as StatusTicket)} className={ctrl}>
        {STATUS_VALIDOS.map((s) => (
          <option key={s} value={s}>{STATUS_ROTULO[s]}</option>
        ))}
      </select>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={2}
        placeholder="Comentário (opcional)"
        className={ctrl}
      />
      {msg && <p className="text-xs text-faj-erro">{msg}</p>}
      <button
        type="submit"
        disabled={salvando}
        className="w-full rounded-[var(--radius-faj)] bg-faj-azul px-3 py-2 text-sm font-semibold text-white hover:bg-faj-azul-medio disabled:opacity-60"
      >
        {salvando ? "Atualizando..." : "Atualizar status"}
      </button>
    </form>
  );
}
