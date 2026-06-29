import { query, temBanco } from "@/lib/db";
import type { FormDef } from "@/lib/forms/tipos";
import { FECHADOS, type StatusTicket } from "./status";

export type { StatusTicket } from "./status";
export { STATUS_VALIDOS } from "./status";

export type TicketDetalhe = {
  id: string;
  protocolo: string | null;
  titulo: string | null;
  setorNome: string;
  status: StatusTicket;
  respostas: Record<string, unknown>;
  solicitanteNome: string | null;
  solicitanteEmail: string | null;
  dataAbertura: string;
  slaRespostaEstourado: boolean;
  slaResolucaoEstourado: boolean;
  def: FormDef;
  historico: {
    de: string | null;
    para: string;
    autor: string | null;
    comentario: string | null;
    quando: string;
  }[];
};

export async function getTicket(id: number): Promise<TicketDetalhe | null> {
  if (!temBanco()) return null;
  try {
    const t = (
      await query<{
        id: string;
        protocolo: string | null;
        titulo: string | null;
        setor_nome: string;
        status: StatusTicket;
        respostas: Record<string, unknown>;
        solicitante_nome: string | null;
        solicitante_email: string | null;
        data_abertura: string;
        sla_resposta_estourado: boolean;
        sla_resolucao_estourado: boolean;
        definicao: FormDef;
      }>(
        `SELECT t.id, t.protocolo, t.titulo, s.nome AS setor_nome, t.status::text AS status,
                t.respostas, t.solicitante_nome, t.solicitante_email,
                to_char(t.data_abertura, 'DD/MM/YYYY HH24:MI') AS data_abertura,
                t.sla_resposta_estourado, t.sla_resolucao_estourado,
                fv.definicao
           FROM tickets.tickets t
           JOIN tickets.setores s ON s.id = t.setor_id
           JOIN tickets.formulario_versoes fv ON fv.id = t.formulario_versao_id
          WHERE t.id = $1`,
        [id],
      )
    )[0];
    if (!t) return null;

    const hist = await query<{
      de: string | null;
      para: string;
      autor: string | null;
      comentario: string | null;
      quando: string;
    }>(
      `SELECT de_status::text AS de, para_status::text AS para, autor_nome AS autor, comentario,
              to_char(created_at, 'DD/MM/YYYY HH24:MI') AS quando
         FROM tickets.ticket_historico WHERE ticket_id = $1 ORDER BY created_at`,
      [id],
    );

    return {
      id: t.id,
      protocolo: t.protocolo,
      titulo: t.titulo,
      setorNome: t.setor_nome,
      status: t.status,
      respostas: t.respostas,
      solicitanteNome: t.solicitante_nome,
      solicitanteEmail: t.solicitante_email,
      dataAbertura: t.data_abertura,
      slaRespostaEstourado: t.sla_resposta_estourado,
      slaResolucaoEstourado: t.sla_resolucao_estourado,
      def: t.definicao,
      historico: hist,
    };
  } catch (err) {
    console.error("[getTicket]", err);
    return null;
  }
}

export async function mudarStatus(
  id: number,
  novo: StatusTicket,
  comentario: string | null,
  autor: { id?: string | null; nome?: string | null },
): Promise<boolean> {
  const cur = (
    await query<{ status: StatusTicket }>(`SELECT status::text AS status FROM tickets.tickets WHERE id = $1`, [id])
  )[0];
  if (!cur) return false;

  const fechado = FECHADOS.includes(novo);
  await query(
    `UPDATE tickets.tickets SET
        status = $2,
        data_primeira_resposta = CASE WHEN data_primeira_resposta IS NULL AND $2 <> 'aberto'
             THEN now() ELSE data_primeira_resposta END,
        sla_resposta_estourado = CASE WHEN data_primeira_resposta IS NULL AND $2 <> 'aberto' AND sla_resposta_meta_min IS NOT NULL
             THEN EXTRACT(EPOCH FROM (now() - data_abertura)) / 60 > sla_resposta_meta_min
             ELSE sla_resposta_estourado END,
        data_fechamento = CASE WHEN $3 THEN now() ELSE data_fechamento END,
        duracao_minutos = CASE WHEN $3 THEN EXTRACT(EPOCH FROM (now() - data_abertura)) / 60 ELSE duracao_minutos END,
        sla_resolucao_estourado = CASE WHEN $3 AND sla_resolucao_meta_min IS NOT NULL
             THEN EXTRACT(EPOCH FROM (now() - data_abertura)) / 60 > sla_resolucao_meta_min
             ELSE sla_resolucao_estourado END,
        updated_at = now()
      WHERE id = $1`,
    [id, novo, fechado],
  );
  await query(
    `INSERT INTO tickets.ticket_historico (ticket_id, de_status, para_status, autor_id, autor_nome, comentario)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, cur.status, novo, autor.id ?? null, autor.nome ?? null, comentario],
  );
  return true;
}
