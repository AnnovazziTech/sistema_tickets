import { redirect } from "next/navigation";
import { authAtivo, sessaoAtual } from "@/lib/auth/sessao";

export default async function GestorLayout({ children }: { children: React.ReactNode }) {
  if (authAtivo()) {
    const s = await sessaoAtual();
    if (!s) redirect("/login");
  }
  return <>{children}</>;
}
