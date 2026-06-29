import type { LucideIcon } from "lucide-react";

export function KpiCard({
  rotulo,
  valor,
  icone: Ico,
  cor = "#06439c",
}: {
  rotulo: string;
  valor: string;
  icone?: LucideIcon;
  cor?: string;
}) {
  return (
    <div className="card-faj p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-faj-texto-muted">{rotulo}</span>
        {Ico && (
          <span style={{ color: cor }}>
            <Ico size={16} />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-faj-texto">{valor}</div>
    </div>
  );
}

/** Formata minutos em "Xh Ym" / "Xd Yh" para os KPIs de tempo. */
export function formatarDuracao(min: number): string {
  if (!min) return "—";
  if (min < 60) return `${Math.round(min)}min`;
  const horas = min / 60;
  if (horas < 24) return `${horas.toFixed(1)}h`;
  return `${(horas / 24).toFixed(1)}d`;
}
