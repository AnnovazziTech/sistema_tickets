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
  responsavelNome: string | null;
  def: FormDef;
  historico: {
    de: string | null;
    para: string;
    autor: string | null;
    comentario: string | null;
    quando: string;
  }[];
  comentarios: { autor: string | null; corpo: string; quando: string }[];
};

export type TicketLinha = {
  id: string;
  protocolo: string | null;
  titulo: string | null;
  setorNome: string;
  setorSlug: string;
  status: StatusTicket;
  dataAbertura: string;
  slaEstourado: boolean;
};

/** Lista tickets com filtros opcionais (setor/status). Sem banco → []. */
export async function listarTickets(
  opts: { setorSlug?: string | null; status?: string | null; limite?: number } = {},
): Promise<TicketLinha[]> {
  if (!temBanco()) return [];
  try {
    const cond: string[] = [];
    const p: unknown[] = [];
    if (opts.setorSlug) {
      p.push(opts.setorSlug);
      cond.push(`s.slug = $${p.length}`);
    }
    if (opts.status) {
      p.push(opts.status);
      cond.push(`t.status = $${p.length}::tickets.ticket_status`);
    }
    const where = cond.length ? `WHERE ${cond.join(" AND ")}` : "";
    p.push(opts.limite ?? 200);
    const rows = await query<{
      id: string;
      protocolo: string | null;
      titulo: string | null;
      setor_nome: string;
      setor_slug: string;
      status: StatusTicket;
      data_abertura: string;
      sla_estourado: boolean;
    }>(
      `SELECT t.id, t.protocolo, t.titulo, s.nome AS setor_nome, s.slug AS setor_slug,
              t.status::text AS status,
              to_char(t.data_abertura, 'DD/MM/YYYY HH24:MI') AS data_abertura,
              (t.sla_resposta_estourado OR t.sla_resolucao_estourado) AS sla_estourado
         FROM tickets.tickets t JOIN tickets.setores s ON s.id = t.setor_id
         ${where}
        ORDER BY t.data_abertura DESC
        LIMIT $${p.length}`,
      p,
    );
    return rows.map((r) => ({
      id: r.id,
      protocolo: r.protocolo,
      titulo: r.titulo,
      setorNome: r.setor_nome,
      setorSlug: r.setor_slug,
      status: r.status,
      dataAbertura: r.data_abertura,
      slaEstourado: r.sla_estourado,
    }));
  } catch (err) {
    console.error("[listarTickets]", err);
    return [];
  }
}

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
        responsavel_nome: string | null;
        definicao: FormDef;
      }>(
        `SELECT t.id, t.protocolo, t.titulo, s.nome AS setor_nome, t.status::text AS status,
                t.respostas, t.solicitante_nome, t.solicitante_email,
                to_char(t.data_abertura, 'DD/MM/YYYY HH24:MI') AS data_abertura,
                t.sla_resposta_estourado, t.sla_resolucao_estourado, t.responsavel_nome,
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

    const coments = await query<{ autor: string | null; corpo: string; quando: string }>(
      `SELECT autor_nome AS autor, corpo, to_char(created_at, 'DD/MM/YYYY HH24:MI') AS quando
         FROM tickets.ticket_comentarios WHERE ticket_id = $1 ORDER BY created_at`,
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
      responsavelNome: t.responsavel_nome,
      def: t.definicao,
      historico: hist,
      comentarios: coments,
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
        status = $2::tickets.ticket_status,
        data_primeira_resposta = CASE WHEN data_primeira_resposta IS NULL AND $2::tickets.ticket_status <> 'aberto'
             THEN now() ELSE data_primeira_resposta END,
        sla_resposta_estourado = CASE WHEN data_primeira_resposta IS NULL AND $2::tickets.ticket_status <> 'aberto' AND sla_resposta_meta_min IS NOT NULL
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

export async function adicionarComentario(
  id: number,
  corpo: string,
  autor: { id?: string | null; nome?: string | null },
): Promise<boolean> {
  const existe = (await query(`SELECT 1 FROM tickets.tickets WHERE id = $1`, [id]))[0];
  if (!existe) return false;
  await query(
    `INSERT INTO tickets.ticket_comentarios (ticket_id, autor_id, autor_nome, corpo)
     VALUES ($1, $2, $3, $4)`,
    [id, autor.id ?? null, autor.nome ?? null, corpo],
  );
  await query(`UPDATE tickets.tickets SET updated_at = now() WHERE id = $1`, [id]);
  return true;
}

export async function assumirTicket(
  id: number,
  autor: { id?: string | null; nome?: string | null },
): Promise<boolean> {
  const r = await query<{ id: string }>(
    `UPDATE tickets.tickets
        SET responsavel_usuario_id = $2, responsavel_nome = $3, updated_at = now()
      WHERE id = $1
      RETURNING id`,
    [id, autor.id ?? null, autor.nome ?? null],
  );
  if (r.length === 0) return false;
  await query(
    `INSERT INTO tickets.ticket_historico (ticket_id, para_status, autor_id, autor_nome, comentario)
     SELECT $1, status, $2, $3, 'Assumiu o ticket' FROM tickets.tickets WHERE id = $1`,
    [id, autor.id ?? null, autor.nome ?? null],
  );
  return true;
}
