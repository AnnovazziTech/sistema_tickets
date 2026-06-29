import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/* ---------- PageHeader ---------- */
export function PageHeader({
  titulo,
  subtitulo,
  icone: Ico,
}: {
  titulo: string;
  subtitulo?: string;
  icone?: LucideIcon;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {Ico && (
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[var(--radius-faj)] bg-faj-azul/10 text-faj-azul">
          <Ico size={18} />
        </span>
      )}
      <div>
        <h1 className="text-lg font-bold text-faj-azul">{titulo}</h1>
        {subtitulo && <p className="text-sm text-faj-texto-dim">{subtitulo}</p>}
      </div>
    </div>
  );
}

/* ---------- Card de seção ---------- */
export function Card({
  titulo,
  descricao,
  children,
  className = "",
}: {
  titulo?: string;
  descricao?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-faj ${className}`}>
      {titulo && (
        <div className="border-b border-faj-border px-4 py-3">
          <h3 className="text-sm font-semibold text-faj-texto">{titulo}</h3>
          {descricao && <p className="mt-0.5 text-xs text-faj-texto-dim">{descricao}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ---------- Formatação de moeda BRL ---------- */
export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
