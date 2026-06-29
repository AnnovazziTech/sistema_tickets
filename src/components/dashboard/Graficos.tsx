"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { rotuloStatus } from "@/lib/tickets/status";
import type { SerieDia, StatusFatia, VolumetriaSetor } from "@/lib/dashboard";

const AZUL = "#162763";
const AZUL_MEDIO = "#06439c";
const LARANJA = "#ed7219";
const CORES = ["#06439c", "#ed7219", "#16a34a", "#dc9a0e", "#dc2626", "#9aa1ad", "#162763"];

function SemDados() {
  return <div className="flex h-[240px] items-center justify-center text-sm text-faj-texto-muted">Sem dados no período.</div>;
}

export function BarSetor({ dados }: { dados: VolumetriaSetor[] }) {
  if (!dados.length) return <SemDados />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={dados} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ee" />
        <XAxis dataKey="setor" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="abertos" name="Abertos" fill={AZUL_MEDIO} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LinhaSerie({ dados }: { dados: SerieDia[] }) {
  if (!dados.length) return <SemDados />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={dados} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ee" />
        <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={4} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="abertos" name="Abertos" stroke={AZUL} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="fechados" name="Fechados" stroke={LARANJA} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonutStatus({ dados }: { dados: StatusFatia[] }) {
  if (!dados.length) return <SemDados />;
  const data = dados.map((d) => ({ name: rotuloStatus(d.status), value: d.total }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
