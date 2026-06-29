import Link from "next/link";
import { redirect } from "next/navigation";
import { authAtivo, sessaoAtual } from "@/lib/auth/sessao";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (authAtivo()) {
    const s = await sessaoAtual();
    if (!s) redirect("/login?callbackUrl=/admin/dashboard");
    if (s.user.papel !== "ADMIN") redirect("/sem-acesso");
  }

  const tab = "rounded-[var(--radius-faj)] px-3 py-1.5 text-[13px] font-medium text-faj-texto-dim hover:bg-faj-bg-suave";
  return (
    <div>
      <div className="mb-5 flex items-center gap-1 border-b border-faj-border pb-3">
        <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-faj-texto-muted">
          Administração
        </span>
        <Link href="/admin/dashboard" className={tab}>Dashboard</Link>
        <Link href="/admin/setores" className={tab}>Setores</Link>
        <Link href="/admin/builder" className={tab}>Builder</Link>
      </div>
      {children}
    </div>
  );
}
