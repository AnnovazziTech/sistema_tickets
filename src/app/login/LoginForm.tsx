"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { Campo } from "@/components/form-fields";

export function LoginForm({
  devAtivo,
  entraAtivo,
  callbackUrl,
}: {
  devAtivo: boolean;
  entraAtivo: boolean;
  callbackUrl: string;
}) {
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("ADMIN");
  const [setor, setSetor] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrarDev(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const r = await signIn("dev", { email, papel, setor, senha, redirect: false });
    setCarregando(false);
    if (r?.error) setErro("Credenciais inválidas.");
    else window.location.href = callbackUrl;
  }

  const inputCls =
    "w-full rounded-[var(--radius-faj)] border border-faj-border bg-white px-2.5 py-2 text-sm outline-none focus:border-faj-azul-medio";

  return (
    <div className="space-y-4">
      {entraAtivo && (
        <button
          onClick={() => signIn("microsoft-entra-id", { callbackUrl })}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-faj)] bg-faj-azul px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-faj-azul-medio"
        >
          <LogIn size={16} /> Entrar com Microsoft
        </button>
      )}

      {entraAtivo && devAtivo && (
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-faj-texto-muted">
          <span className="h-px flex-1 bg-faj-border" /> ou (dev) <span className="h-px flex-1 bg-faj-border" />
        </div>
      )}

      {devAtivo && (
        <form onSubmit={entrarDev} className="space-y-3">
          <Campo label="E-mail">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@grupofaj.com.br"
              className={inputCls}
            />
          </Campo>
          <Campo label="Papel (dev)">
            <select value={papel} onChange={(e) => setPapel(e.target.value)} className={inputCls}>
              <option value="ADMIN">ADMIN (Controladoria/P&D)</option>
              <option value="GESTOR">GESTOR</option>
              <option value="MEMBRO">MEMBRO</option>
            </select>
          </Campo>
          {papel !== "ADMIN" && (
            <Campo label="Setor (slug, opcional — ex.: dho, comercial)">
              <input
                type="text"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="dho"
                className={inputCls}
              />
            </Campo>
          )}
          <Campo label="Senha">
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={inputCls}
            />
          </Campo>
          {erro && <p className="text-sm font-medium text-faj-erro">{erro}</p>}
          <button
            type="submit"
            disabled={carregando}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-faj)] border border-faj-border px-4 py-2.5 text-sm font-semibold text-faj-texto transition-colors hover:bg-faj-bg-suave disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar (desenvolvimento)"}
          </button>
        </form>
      )}

      {!devAtivo && !entraAtivo && (
        <p className="text-sm text-faj-texto-dim">
          Nenhum provedor de login configurado. Defina <code>AUTH_DEV_LOGIN=true</code> (dev) ou as
          credenciais do Microsoft Entra ID.
        </p>
      )}
    </div>
  );
}
