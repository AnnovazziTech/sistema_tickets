import Link from "next/link";
import { LayoutGrid, Ticket } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { IconeDinamico } from "@/components/builder/IconeDinamico";
import { listarSetoresComFormularios } from "@/lib/forms/publicados";
import { escopoAtual } from "@/lib/auth/sessao";

export const dynamic = "force-dynamic";

export default async function Home() {
  const escopo = await escopoAtual();
  let setores = await listarSetoresComFormularios();

  // Gestor/membro com setor definido vê apenas o próprio setor.
  if (!escopo.admin && escopo.setorSlug) {
    setores = setores.filter((s) => s.slug === escopo.setorSlug);
  }

  return (
    <div>
      <PageHeader
        titulo={escopo.nome ? `Olá, ${escopo.nome}` : "Tickets FAJ"}
        subtitulo="Abra um ticket escolhendo o formulário do setor."
        icone={LayoutGrid}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 rounded-[var(--radius-faj)] border border-faj-border px-3 py-2 text-sm font-semibold text-faj-texto hover:bg-faj-bg-suave"
        >
          <Ticket size={15} /> Ver tickets
        </Link>
        {escopo.admin && (
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-[var(--radius-faj)] bg-faj-azul px-3 py-2 text-sm font-semibold text-white hover:bg-faj-azul-medio"
          >
            <LayoutGrid size={15} /> Painel administrativo
          </Link>
        )}
      </div>

      {setores.length === 0 ? (
        <Card>
          <p className="text-sm text-faj-texto-dim">
            Nenhum formulário publicado ainda
            {escopo.admin ? (
              <>
                {" "}— comece cadastrando um setor e montando um formulário em{" "}
                <Link href="/admin/builder" className="font-semibold text-faj-azul-medio hover:underline">
                  Builder
                </Link>
                .
              </>
            ) : (
              " para o seu setor."
            )}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {setores.map((s) => (
            <Card
              key={s.slug}
              titulo={s.nome}
            >
              <div className="mb-2 -mt-1 flex items-center gap-2 text-faj-azul">
                <IconeDinamico nome={s.icone ?? "Folder"} size={16} />
                <Link href={`/${s.slug}`} className="text-xs font-semibold text-faj-azul-medio hover:underline">
                  ver setor
                </Link>
              </div>
              <ul className="space-y-1">
                {s.formularios.map((f) => (
                  <li key={f.slug}>
                    <Link
                      href={`/${s.slug}/${f.slug}`}
                      className="flex items-center justify-between rounded-[var(--radius-faj)] border border-faj-border px-3 py-2 text-sm text-faj-texto transition-colors hover:border-faj-azul-medio hover:bg-faj-bg-suave"
                    >
                      <span className="font-medium">{f.nome}</span>
                      <span className="text-faj-azul-medio">abrir →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
