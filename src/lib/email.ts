import nodemailer, { type Transporter } from "nodemailer";
import { camposDeDados, type FormDef } from "./forms/tipos";
import { formatarResposta } from "./forms/formatarResposta";

const DESTINATARIOS_FALLBACK = "dp@grupofaj.com.br, rh@grupofaj.com.br";

type Respostas = Record<string, unknown>;

function montarLinhas(def: FormDef, respostas: Respostas): [string, string][] {
  const linhas: [string, string][] = [];
  for (const campo of camposDeDados(def)) {
    const v = formatarResposta(campo, respostas[campo.id]);
    if (v) linhas.push([campo.label, v]);
  }
  return linhas;
}

function aplicarTemplate(template: string, respostas: Respostas, protocolo: string): string {
  return template
    .replace(/\{\{\s*protocolo\s*\}\}/g, protocolo)
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => String(respostas[k] ?? ""));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// `undefined` = não inicializado · `null` = SMTP não configurado.
let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    transporter = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export function destinatariosTicket(def: FormDef): string {
  const dosForm = def.notificacoes?.emails?.join(", ");
  return dosForm || process.env.MAIL_TO?.trim() || DESTINATARIOS_FALLBACK;
}

/**
 * Notifica os responsáveis sobre um novo ticket. Best-effort: nunca lança — devolve
 * `enviado:false` com o motivo se o SMTP não estiver configurado ou falhar.
 * Os destinatários vêm da definição (`notificacoes.emails`) ou de MAIL_TO.
 */
export async function enviarNotificacaoTicket(
  def: FormDef,
  respostas: Respostas,
  protocolo: string,
): Promise<{ enviado: boolean; destinatarios: string; erro?: string }> {
  const to = destinatariosTicket(def);
  const t = getTransporter();
  if (!t) return { enviado: false, destinatarios: to, erro: "SMTP não configurado." };

  const from = process.env.MAIL_FROM?.trim() || process.env.SMTP_USER!;
  const linhas = montarLinhas(def, respostas);
  const assunto = def.notificacoes?.assuntoTemplate
    ? aplicarTemplate(def.notificacoes.assuntoTemplate, respostas, protocolo)
    : `${def.titulo} — ${protocolo}`;

  const text = [
    `${def.titulo} — Protocolo ${protocolo}`,
    "",
    ...linhas.map(([k, v]) => `${k}: ${v}`),
  ].join("\n");

  const tr = linhas
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;border:1px solid #e4e7ee;background:#f3f4f7;font-weight:600;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 12px;border:1px solid #e4e7ee">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const html = `
  <div style="font-family:Segoe UI,system-ui,sans-serif;color:#1f2430;max-width:640px">
    <h2 style="color:#162763;margin:0 0 4px">${escapeHtml(def.titulo)}</h2>
    <p style="margin:0 0 16px;color:#5b6472">Protocolo <strong style="font-family:monospace;color:#162763">${protocolo}</strong></p>
    <table style="border-collapse:collapse;width:100%;font-size:14px">${tr}</table>
  </div>`;

  try {
    await t.sendMail({ from, to, subject: assunto, text, html });
    return { enviado: true, destinatarios: to };
  } catch (err) {
    console.error("[email] falha ao notificar:", err);
    return { enviado: false, destinatarios: to, erro: (err as Error).message };
  }
}
