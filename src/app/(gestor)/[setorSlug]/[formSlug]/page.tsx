import { notFound, redirect } from "next/navigation";
import { FormRenderer } from "@/components/renderer/FormRenderer";
import { getCatalogos } from "@/lib/catalogos";
import { getFormularioPublicado } from "@/lib/forms/repo";
import { escopoAtual } from "@/lib/auth/sessao";

export const dynamic = "force-dynamic";

export default async function FormularioPage({
  params,
}: {
  params: Promise<{ setorSlug: string; formSlug: string }>;
}) {
  const { setorSlug, formSlug } = await params;

  // Gestor/membro só abre formulário do próprio setor.
  const escopo = await escopoAtual();
  if (!escopo.admin && escopo.setorSlug && escopo.setorSlug !== setorSlug) {
    redirect("/sem-acesso");
  }

  const form = await getFormularioPublicado(setorSlug, formSlug);
  if (!form) notFound();

  const catalogos = await getCatalogos();
  return (
    <FormRenderer
      def={form.def}
      catalogos={catalogos}
      action={`/api/abrir/${setorSlug}/${formSlug}`}
    />
  );
}
