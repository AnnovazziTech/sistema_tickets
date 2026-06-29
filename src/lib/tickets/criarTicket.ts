import { query } from "@/lib/db";
import { buildZodSchema } from "@/lib/forms/buildZodSchema";
import { getFormularioPublicado } from "@/lib/forms/repo";
import { enviarNotificacaoTicket } from "@/lib/email";

export type ResultadoCriacao =
  | {
      ok: true;
      status: number;
      data: { id: string; protocolo: string; emailEnviado: boolean; destinatarios: string };
    }
  | { ok: false; status: number; error: string; issues?: { path: (string | number)[]; message: string }[] };

type SlaRow = { tempo_primeira_resposta_min: number; tempo_resolucao_min: number; prioridade: number };
type InsRow = { id: string; ano: string };

/**
 * Cria um ticket genérico: valida o corpo contra a definição publicada do formulário,
 * grava em tickets.tickets (com snapshot de SLA), registra o histórico inicial e
 * notifica os responsáveis (best-effort). Reutilizado pela rota genérica e pelo shim do DHO.
 */
export async function criarTicket(
  setorSlug: string,
  formSlug: string,
  body: unknown,
): Promise<ResultadoCriacao> {
  const form = await getFormularioPublicado(setorSlug, formSlug);
  if (!form) {
    return { ok: false, status: 404, error: "Formulário não encontrado." };
  }
  if (form.formularioId == null || form.versaoId == null || form.setorId == null) {
    return {
      ok: false,
      status: 503,
      error:
        "Formulário ainda não publicado no banco. Configure DATABASE_URL e rode `npm run migrate` + `npm run seed`.",
    };
  }

  const parsed = buildZodSchema(form.def).safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: "Há campos inválidos na solicitação.",
      issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    };
  }
  const respostas = parsed.data as Record<string, unknown>;

  const titulo = form.def.campoTitulo ? String(respostas[form.def.campoTitulo] ?? "") : null;
  const solicitanteNome = (respostas.solicitanteNome as string) || null;
  const solicitanteEmail = (respostas.solicitanteEmail as string) || null;

  try {
    // Snapshot do SLA padrão do formulário (tipo NULL).
    const sla = (
      await query<SlaRow>(
        `SELECT tempo_primeira_resposta_min, tempo_resolucao_min, prioridade
           FROM tickets.sla_config
          WHERE formulario_id = $1 AND tipo IS NULL AND ativo
          ORDER BY prioridade DESC
          LIMIT 1`,
        [form.formularioId],
      )
    )[0];

    const ins = (
      await query<InsRow>(
        `INSERT INTO tickets.tickets (
           formulario_id, formulario_versao_id, setor_id, titulo, respostas,
           solicitante_nome, solicitante_email,
           prioridade, sla_resposta_meta_min, sla_resolucao_meta_min
         ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10)
         RETURNING id, to_char(created_at, 'YYYY') AS ano`,
        [
          form.formularioId,
          form.versaoId,
          form.setorId,
          titulo,
          JSON.stringify(respostas),
          solicitanteNome,
          solicitanteEmail,
          sla?.prioridade ?? 0,
          sla?.tempo_primeira_resposta_min ?? null,
          sla?.tempo_resolucao_min ?? null,
        ],
      )
    )[0];

    const protocolo = `${form.prefixo}-${ins.ano}-${String(ins.id).padStart(5, "0")}`;
    await query(`UPDATE tickets.tickets SET protocolo = $1 WHERE id = $2`, [protocolo, ins.id]);

    // Histórico inicial.
    await query(
      `INSERT INTO tickets.ticket_historico (ticket_id, para_status, autor_nome, comentario)
       VALUES ($1, 'aberto', $2, 'Ticket aberto')`,
      [ins.id, solicitanteNome],
    );

    const email = await enviarNotificacaoTicket(form.def, respostas, protocolo);

    return {
      ok: true,
      status: 201,
      data: {
        id: ins.id,
        protocolo,
        emailEnviado: email.enviado,
        destinatarios: email.destinatarios,
      },
    };
  } catch (err) {
    console.error("[criarTicket]", err);
    return {
      ok: false,
      status: 500,
      error:
        "Não foi possível registrar a solicitação. Verifique a conexão com o banco (DATABASE_URL) e a migração.",
    };
  }
}
