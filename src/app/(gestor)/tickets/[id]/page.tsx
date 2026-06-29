import { notFound } from "next/navigation";
import { Ticket } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { Campo } from "@/components/form-fields";
import { StatusChanger } from "@/components/tickets/StatusChanger";
import { getTicket } from "@/lib/tickets/ticketRepo";
import { rotuloStatus, tomStatus } from "@/lib/tickets/status";
import { camposDeDados } from "@/lib/forms/tipos";
import { formatarResposta } from "@/lib/forms/formatarResposta";

export const dynamic = "force-dynamic";

export default async function TicketDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTicket(Number(id));
  if (!t) notFound();

  const campos = camposDeDados(t.def).filter((c) => formatarResposta(c, t.respostas[c.id]) !== "");

  return (
    <div>
      <PageHeader
        titulo={t.protocolo ?? `Ticket #${t.id}`}
        subtitulo={`${t.titulo ?? t.def.titulo} · ${t.setorNome} · aberto em ${t.dataAbertura}`}
        icone={Ticket}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card titulo="Dados da solicitação">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {campos.map((c) => (
                <div key={c.id}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-faj-texto-muted">{c.label}</div>
                  <div className="text-sm text-faj-texto">{formatarResposta(c, t.respostas[c.id])}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card titulo="Histórico">
            {t.historico.length === 0 ? (
              <p className="text-sm text-faj-texto-dim">Sem movimentações.</p>
            ) : (
              <ul className="space-y-2">
                {t.historico.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-faj-azul-medio" />
                    <div>
                      <span className="text-faj-texto">
                        {h.de ? `${rotuloStatus(h.de)} → ` : ""}
                        <strong>{rotuloStatus(h.para)}</strong>
                      </span>
                      {h.comentario && <p className="text-faj-texto-dim">{h.comentario}</p>}
                      <p className="text-xs text-faj-texto-muted">
                        {h.quando}
                        {h.autor ? ` · ${h.autor}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card titulo="Status">
            <div className="mb-3">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tomStatus(t.status)}`}>
                {rotuloStatus(t.status)}
              </span>
              {(t.slaRespostaEstourado || t.slaResolucaoEstourado) && (
                <span className="ml-2 inline-flex rounded-full bg-faj-erro/10 px-2 py-0.5 text-[11px] font-semibold text-faj-erro">
                  SLA estourado
                </span>
              )}
            </div>
            <StatusChanger ticketId={t.id} statusAtual={t.status} />
          </Card>

          {(t.solicitanteNome || t.solicitanteEmail) && (
            <Card titulo="Solicitante">
              <Campo label="Nome">
                <p className="text-sm text-faj-texto">{t.solicitanteNome ?? "—"}</p>
              </Campo>
              {t.solicitanteEmail && (
                <p className="mt-2 text-sm text-faj-texto-dim">{t.solicitanteEmail}</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
