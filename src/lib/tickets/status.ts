// Client-safe (sem db): tipos e rótulos de status do ticket.

export type StatusTicket =
  | "aberto"
  | "em_analise"
  | "aguardando_solicitante"
  | "aprovado"
  | "reprovado"
  | "concluido"
  | "cancelado";

export const STATUS_VALIDOS: StatusTicket[] = [
  "aberto",
  "em_analise",
  "aguardando_solicitante",
  "aprovado",
  "reprovado",
  "concluido",
  "cancelado",
];

export const FECHADOS: StatusTicket[] = ["concluido", "reprovado", "cancelado"];

export const STATUS_ROTULO: Record<StatusTicket, string> = {
  aberto: "Aberto",
  em_analise: "Em análise",
  aguardando_solicitante: "Aguardando solicitante",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const STATUS_TOM: Record<StatusTicket, string> = {
  aberto: "bg-faj-azul-medio/10 text-faj-azul-medio",
  em_analise: "bg-faj-azul-medio/10 text-faj-azul-medio",
  aguardando_solicitante: "bg-faj-aviso/10 text-faj-aviso",
  aprovado: "bg-faj-sucesso/10 text-faj-sucesso",
  reprovado: "bg-faj-erro/10 text-faj-erro",
  concluido: "bg-faj-sucesso/10 text-faj-sucesso",
  cancelado: "bg-faj-texto-muted/10 text-faj-texto-dim",
};

export function rotuloStatus(s: string): string {
  return STATUS_ROTULO[s as StatusTicket] ?? s;
}
export function tomStatus(s: string): string {
  return STATUS_TOM[s as StatusTicket] ?? STATUS_TOM.aberto;
}
