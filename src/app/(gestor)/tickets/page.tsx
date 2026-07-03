import Link from "next/link";
import { Ticket } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { listarTickets } from "@/lib/tickets/ticketRepo";
import { STATUS_VALIDOS, rotuloStatus, tomStatus } from "@/lib/tickets/status";
import { escopoAtual } from "@/lib/auth/sessao";

export const dynamic = "force-dynamic";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; setor?: string }>;
}) {
  const { status, setor } = await searchParams;
  const escopo = await escopoAtual();

  // Não-admin só enxerga o próprio setor (quando definido).
  const setorSlug = escopo.admin ? setor || null : escopo.setorSlug;
  const tickets = await listarTickets({ setorSlug, status: status || null });

  const filtro = (label: string, valor: string | null) => {
    const params = new URLSearchParams();
    if (valor) params.set("status", valor);
    if (escopo.admin && setor) params.set("setor", setor);
    const qs = params.toString();
    const ativo = (status ?? "") === (valor ?? "");
    return (
      <Link
        key={label}
        href={`/tickets${qs ? `?${qs}` : ""}`}
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          ativo ? "bg-faj-azul text-white" : "bg-faj-bg-suave text-faj-texto-dim hover:bg-faj-border"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div>
      <PageHeader
        titulo="Tickets"
        subtitulo={
          escopo.admin
            ? "Todos os setores."
            : escopo.setorSlug
              ? `Setor: ${escopo.setorSlug}`
              : "Seus tickets."
        }
        icone={Ticket}
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {filtro("Todos", null)}
        {STATUS_VALIDOS.map((s) => filtro(rotuloStatus(s), s))}
      </div>

      <Card titulo={`${tickets.length} ticket(s)`}>
        {tickets.length === 0 ? (
          <p className="text-sm text-faj-texto-dim">Nenhum ticket encontrado com este filtro.</p>
        ) : (
          <ul className="divide-y divide-faj-border">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center gap-2 py-2 text-sm">
                <Link href={`/tickets/${t.id}`} className="font-mono text-xs font-semibold text-faj-azul hover:underline">
                  {t.protocolo ?? `#${t.id}`}
                </Link>
                <span className="truncate text-faj-texto">{t.titulo ?? "—"}</span>
                <span className="text-xs text-faj-texto-muted">{t.setorNome}</span>
                <span className="ml-auto text-xs text-faj-texto-muted">{t.dataAbertura}</span>
                {t.slaEstourado && (
                  <span className="rounded-full bg-faj-erro/10 px-2 py-0.5 text-[10px] font-semibold text-faj-erro">
                    SLA
                  </span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tomStatus(t.status)}`}>
                  {rotuloStatus(t.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
