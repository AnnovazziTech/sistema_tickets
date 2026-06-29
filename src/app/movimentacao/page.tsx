import { redirect } from "next/navigation";

// Compatibilidade: a tela de movimentação agora é o formulário no-code do DHO.
export default function MovimentacaoLegado() {
  redirect("/dho/movimentacao");
}
