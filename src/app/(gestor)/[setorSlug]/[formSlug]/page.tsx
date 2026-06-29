import { notFound } from "next/navigation";
import { FormRenderer } from "@/components/renderer/FormRenderer";
import { getCatalogos } from "@/lib/catalogos";
import { getFormularioPublicado } from "@/lib/forms/repo";

export const dynamic = "force-dynamic";

export default async function FormularioPage({
  params,
}: {
  params: Promise<{ setorSlug: string; formSlug: string }>;
}) {
  const { setorSlug, formSlug } = await params;
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
