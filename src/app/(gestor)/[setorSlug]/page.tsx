import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { IconeDinamico } from "@/components/builder/IconeDinamico";
import { getSetorPorSlug, listarFormulariosPublicados } from "@/lib/forms/publicados";
import { escopoAtual } from "@/lib/auth/sessao";

export const dynamic = "force-dynamic";

export default async function SetorHome({ params }: { params: Promise<{ setorSlug: string }> }) {
  const { setorSlug } = await params;
  const escopo = await escopoAtual();

  // Gestor/membro só acessa o próprio setor.
  if (!escopo.admin && escopo.setorSlug && escopo.setorSlug !== setorSlug) {
    redirect("/sem-acesso");
  }

  const setor = await getSetorPorSlug(setorSlug);
  if (!setor) notFound();
  const formularios = await listarFormulariosPublicados(setorSlug);

  return (
    <div>
      <PageHeader
        titulo={setor.nome}
        subtitulo="Formulários disponíveis neste setor."
        icone={undefined}
      />
      <div className="mb-4 flex items-center gap-2 text-faj-azul">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-faj)] bg-faj-azul/10">
          <IconeDinamico nome={setor.icone ?? "Folder"} size={17} />
        </span>
      </div>

      {formularios.length === 0 ? (
        <Card>
          <p className="text-sm text-faj-texto-dim">Nenhum formulário publicado neste setor.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {formularios.map((f) => (
            <Link
              key={f.slug}
              href={`/${setorSlug}/${f.slug}`}
              className="card-faj block p-4 transition-colors hover:border-faj-azul-medio"
            >
              <div className="flex items-center gap-2">
                <IconeDinamico nome={f.icone ?? "FileText"} size={16} className="text-faj-azul-medio" />
                <span className="font-semibold text-faj-texto">{f.nome}</span>
              </div>
              {f.descricao && <p className="mt-1 text-sm text-faj-texto-dim">{f.descricao}</p>}
              <span className="mt-2 inline-block text-xs font-semibold text-faj-azul-medio">Abrir ticket →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
