import { notFound } from "next/navigation";
import { FormBuilder } from "@/components/builder/FormBuilder";
import { getFormularioParaEdicao } from "@/lib/forms/builderRepo";
import { SEED_DHO } from "@/lib/forms/seedDho";

export const dynamic = "force-dynamic";

export default async function EditorPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;

  // Demonstração sem banco: edita o seed do DHO (não persiste).
  if (formId === "demo") {
    return (
      <FormBuilder
        formularioId={null}
        nome={SEED_DHO.formulario.nome}
        setorNome={SEED_DHO.setor.nome}
        defInicial={SEED_DHO.definicao}
      />
    );
  }

  const f = await getFormularioParaEdicao(Number(formId));
  if (!f) notFound();

  return (
    <FormBuilder
      formularioId={f.id}
      nome={f.nome}
      setorNome={f.setorNome}
      defInicial={f.def}
    />
  );
}
