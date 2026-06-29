import Link from "next/link";
import { Wrench } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { listarFormularios, listarSetores } from "@/lib/forms/builderRepo";
import { NovoFormulario } from "./NovoFormulario";

export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const [forms, setores] = await Promise.all([listarFormularios(), listarSetores()]);

  return (
    <div>
      <PageHeader
        titulo="Builder de formulários"
        subtitulo="Monte a tela de cada setor escolhendo os componentes — sem código."
        icone={Wrench}
      />

      {setores.length > 0 ? (
        <Card titulo="Novo formulário" className="mb-4">
          <NovoFormulario setores={setores} />
        </Card>
      ) : (
        <Card titulo="Novo formulário" className="mb-4">
          <p className="text-sm text-faj-texto-dim">
            Nenhum setor disponível. Cadastre um setor primeiro em{" "}
            <Link href="/admin/setores" className="font-semibold text-faj-azul-medio hover:underline">
              Setores
            </Link>{" "}
            (requer banco configurado).
          </p>
        </Card>
      )}

      <Card titulo={`Formulários (${forms.length})`}>
        {forms.length === 0 ? (
          <p className="text-sm text-faj-texto-dim">
            Nenhum formulário no banco (ou banco indisponível).
            <Link href="/admin/builder/demo" className="ml-1 font-semibold text-faj-azul-medio hover:underline">
              Abrir demonstração (DHO)
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-faj-border">
            {forms.map((f) => (
              <li key={f.id} className="flex items-center gap-2 py-2">
                <Link href={`/admin/builder/${f.id}`} className="font-medium text-faj-azul hover:underline">
                  {f.nome}
                </Link>
                <span className="text-xs text-faj-texto-muted">
                  {f.setorNome} · /{f.setorSlug}/{f.slug}
                </span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    f.publicado ? "bg-faj-sucesso/10 text-faj-sucesso" : "bg-faj-aviso/10 text-faj-aviso"
                  }`}
                >
                  {f.publicado ? "publicado" : "rascunho"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
