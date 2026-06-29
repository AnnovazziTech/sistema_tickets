import Link from "next/link";
import { AlertTriangle, Gauge, LayoutGrid, Ticket, TrendingUp } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { KpiCard, formatarDuracao } from "@/components/dashboard/KpiCard";
import { BarSetor, DonutStatus, LinhaSerie } from "@/components/dashboard/Graficos";
import { getDashboard } from "@/lib/dashboard";
import { rotuloStatus, tomStatus } from "@/lib/tickets/status";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const d = await getDashboard();

  return (
    <div>
      <PageHeader
        titulo="Dashboard de gestão"
        subtitulo="SLA, volumetria e KPIs de todos os setores."
        icone={LayoutGrid}
      />

      {!d.disponivel && (
        <div className="mb-4 rounded-[var(--radius-faj)] border border-faj-aviso/40 bg-faj-aviso/10 p-3 text-sm text-faj-texto">
          Banco indisponível ou sem tickets ainda. Configure <code>DATABASE_URL</code>, rode{" "}
          <code>npm run migrate</code> + <code>npm run seed</code> e registre tickets.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard rotulo="Tickets abertos" valor={String(d.kpis.abertos)} icone={Ticket} />
        <KpiCard
          rotulo="SLA estourado"
          valor={`${d.kpis.pctSlaEstourado}%`}
          icone={AlertTriangle}
          cor="#dc2626"
        />
        <KpiCard rotulo="Méd. 1ª resposta" valor={formatarDuracao(d.kpis.mediaPrimeiraRespMin)} icone={Gauge} />
        <KpiCard rotulo="Méd. resolução" valor={formatarDuracao(d.kpis.mediaResolucaoMin)} icone={TrendingUp} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card titulo="Volumetria por setor (abertos)">
          <BarSetor dados={d.volumetria} />
        </Card>
        <Card titulo="Distribuição por status">
          <DonutStatus dados={d.porStatus} />
        </Card>
      </div>

      <Card titulo="Abertos vs. fechados (30 dias)" className="mb-4">
        <LinhaSerie dados={d.serie} />
      </Card>

      <Card titulo="Tickets recentes">
        {d.recentes.length === 0 ? (
          <p className="text-sm text-faj-texto-dim">Nenhum ticket registrado.</p>
        ) : (
          <ul className="divide-y divide-faj-border">
            {d.recentes.map((t) => (
              <li key={t.id} className="flex items-center gap-2 py-2 text-sm">
                <Link href={`/tickets/${t.id}`} className="font-mono text-xs font-semibold text-faj-azul hover:underline">
                  {t.protocolo ?? `#${t.id}`}
                </Link>
                <span className="truncate text-faj-texto">{t.titulo ?? "—"}</span>
                <span className="text-xs text-faj-texto-muted">{t.setor}</span>
                <span className="ml-auto text-xs text-faj-texto-muted">{t.dataAbertura}</span>
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
