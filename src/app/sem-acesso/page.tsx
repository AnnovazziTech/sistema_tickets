import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function SemAcesso() {
  return (
    <div className="mx-auto max-w-md pt-10 text-center">
      <ShieldAlert size={36} className="mx-auto text-faj-laranja" />
      <h1 className="mt-3 text-lg font-bold text-faj-azul">Acesso restrito</h1>
      <p className="mt-1 text-sm text-faj-texto-dim">
        Esta área é exclusiva da administração (Controladoria e P&D).
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-[var(--radius-faj)] bg-faj-azul px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-faj-azul-medio"
      >
        Voltar
      </Link>
    </div>
  );
}
