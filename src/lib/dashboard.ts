import { query, temBanco } from "@/lib/db";

export type KpisGerais = {
  abertos: number;
  pctSlaEstourado: number;
  mediaPrimeiraRespMin: number;
  mediaResolucaoMin: number;
};
export type VolumetriaSetor = { setor: string; abertos: number };
export type SerieDia = { dia: string; abertos: number; fechados: number };
export type StatusFatia = { status: string; total: number };
export type TicketRecente = {
  id: string;
  protocolo: string | null;
  titulo: string | null;
  setor: string;
  status: string;
  dataAbertura: string;
};

export type DashboardData = {
  kpis: KpisGerais;
  volumetria: VolumetriaSetor[];
  serie: SerieDia[];
  porStatus: StatusFatia[];
  recentes: TicketRecente[];
  disponivel: boolean;
};

const VAZIO: DashboardData = {
  kpis: { abertos: 0, pctSlaEstourado: 0, mediaPrimeiraRespMin: 0, mediaResolucaoMin: 0 },
  volumetria: [],
  serie: [],
  porStatus: [],
  recentes: [],
  disponivel: false,
};

const FECHADOS = "('concluido','reprovado','cancelado')";

export async function getDashboard(): Promise<DashboardData> {
  if (!temBanco()) return VAZIO;
  try {
    const [kpi, vol, serie, st, rec] = await Promise.all([
      query<{ abertos: string; pct: string; m1: string; mr: string }>(
        `SELECT
           count(*) FILTER (WHERE status NOT IN ${FECHADOS}) AS abertos,
           COALESCE(count(*) FILTER (WHERE sla_resolucao_estourado)::numeric / NULLIF(count(*), 0), 0) AS pct,
           COALESCE(avg(EXTRACT(EPOCH FROM (data_primeira_resposta - data_abertura)) / 60)
             FILTER (WHERE data_primeira_resposta IS NOT NULL), 0) AS m1,
           COALESCE(avg(duracao_minutos) FILTER (WHERE data_fechamento IS NOT NULL), 0) AS mr
         FROM tickets.tickets`,
      ),
      query<{ setor: string; abertos: string }>(
        `SELECT s.nome AS setor, count(*) AS abertos
           FROM tickets.tickets t JOIN tickets.setores s ON s.id = t.setor_id
          WHERE t.status NOT IN ${FECHADOS}
          GROUP BY s.nome ORDER BY abertos DESC`,
      ),
      query<{ dia: string; abertos: string; fechados: string }>(
        `SELECT to_char(d::date, 'DD/MM') AS dia,
                (SELECT count(*) FROM tickets.tickets t WHERE t.data_abertura::date = d::date) AS abertos,
                (SELECT count(*) FROM tickets.tickets t WHERE t.data_fechamento::date = d::date) AS fechados
           FROM generate_series((now() - interval '29 days')::date, now()::date, interval '1 day') d
          ORDER BY d`,
      ),
      query<{ status: string; total: string }>(
        `SELECT status::text AS status, count(*) AS total FROM tickets.tickets GROUP BY status ORDER BY total DESC`,
      ),
      query<{
        id: string;
        protocolo: string | null;
        titulo: string | null;
        setor: string;
        status: string;
        data_abertura: string;
      }>(
        `SELECT t.id, t.protocolo, t.titulo, s.nome AS setor, t.status::text AS status,
                to_char(t.data_abertura, 'DD/MM/YYYY HH24:MI') AS data_abertura
           FROM tickets.tickets t JOIN tickets.setores s ON s.id = t.setor_id
          ORDER BY t.data_abertura DESC LIMIT 10`,
      ),
    ]);

    const k = kpi[0];
    return {
      kpis: {
        abertos: Number(k?.abertos ?? 0),
        pctSlaEstourado: Math.round(Number(k?.pct ?? 0) * 100),
        mediaPrimeiraRespMin: Math.round(Number(k?.m1 ?? 0)),
        mediaResolucaoMin: Math.round(Number(k?.mr ?? 0)),
      },
      volumetria: vol.map((r) => ({ setor: r.setor, abertos: Number(r.abertos) })),
      serie: serie.map((r) => ({ dia: r.dia, abertos: Number(r.abertos), fechados: Number(r.fechados) })),
      porStatus: st.map((r) => ({ status: r.status, total: Number(r.total) })),
      recentes: rec.map((r) => ({
        id: r.id,
        protocolo: r.protocolo,
        titulo: r.titulo,
        setor: r.setor,
        status: r.status,
        dataAbertura: r.data_abertura,
      })),
      disponivel: true,
    };
  } catch (err) {
    console.error("[dashboard] indisponível:", err);
    return VAZIO;
  }
}
