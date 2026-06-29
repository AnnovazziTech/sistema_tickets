import Link from "next/link";
import { Boxes } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { IconeDinamico } from "@/components/builder/IconeDinamico";
import { listarSetores } from "@/lib/forms/builderRepo";
import { NovoSetor } from "./NovoSetor";

export const dynamic = "force-dynamic";

export default async function SetoresPage() {
  const setores = await listarSetores();

  return (
    <div>
      <PageHeader
        titulo="Setores"
        subtitulo="Cadastre os setores da empresa. Depois, monte os formulários de cada um no Builder."
        icone={Boxes}
      />

      <Card titulo="Novo setor" className="mb-4">
        <NovoSetor />
      </Card>

      <Card titulo={`Setores (${setores.length})`}>
        {setores.length === 0 ? (
          <p className="text-sm text-faj-texto-dim">
            Nenhum setor cadastrado (ou banco indisponível). Configure <code>DATABASE_URL</code>,
            rode <code>npm run migrate</code> + <code>npm run seed</code>, ou crie um acima.
          </p>
        ) : (
          <ul className="divide-y divide-faj-border">
            {setores.map((s) => (
              <li key={s.id} className="flex items-center gap-2.5 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-faj)] bg-faj-azul/10 text-faj-azul">
                  <IconeDinamico nome={s.icone ?? "Folder"} size={14} />
                </span>
                <span className="font-medium text-faj-texto">{s.nome}</span>
                <span className="font-mono text-xs text-faj-texto-muted">/{s.slug}</span>
                <Link
                  href="/admin/builder"
                  className="ml-auto text-xs font-semibold text-faj-azul-medio hover:underline"
                >
                  Criar formulário →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
