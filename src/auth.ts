import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import type { Papel } from "@/lib/auth/resolverPapel";
import {
  verificarTokenHub,
  nivelParaPapel,
  resolverSetor,
  sincronizarUsuario,
} from "@/lib/auth/hubSso";

declare module "next-auth" {
  interface Session {
    user: {
      papel: Papel;
      setorId?: string | null;
      setorNome?: string | null;
      setorSlug?: string | null;
    } & DefaultSession["user"];
  }
}
const providers: Provider[] = [];

// Login de desenvolvimento (sem Azure): habilitado apenas por env-flag.
if (process.env.AUTH_DEV_LOGIN === "true") {
  providers.push(
    Credentials({
      id: "dev",
      name: "Desenvolvimento",
      credentials: {
        email: { label: "E-mail", type: "email" },
        papel: { label: "Papel", type: "text" },
        setor: { label: "Setor (slug)", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      authorize: (cred) => {
        const senhaEsperada = process.env.AUTH_DEV_PASSWORD;
        if (senhaEsperada && cred?.senha !== senhaEsperada) return null;
        const email = String(cred?.email ?? "").trim().toLowerCase();
        if (!email) return null;
        const p = String(cred?.papel ?? "MEMBRO").toUpperCase();
        const papel: Papel = p === "ADMIN" || p === "GESTOR" ? (p as Papel) : "MEMBRO";
        const setorSlug = String(cred?.setor ?? "").trim().toLowerCase() || null;
        return { id: email, email, name: email.split("@")[0], papel, setorSlug };
      },
    }),
  );
}

// SSO corporativo: acesso via Hub de Acesso FAJ. O hub autentica no Microsoft Entra ID e
// redireciona para /api/auth/sso/callback com um JWT curto. Aqui o token é validado (JWKS do
// hub) e trocado por sessão própria. O `nivel` do hub é a fonte de verdade do RBAC.
providers.push(
  Credentials({
    id: "hub-sso",
    name: "Hub de Acesso FAJ",
    credentials: { token: { label: "Token SSO", type: "text" } },
    authorize: async (cred) => {
      const token = String(cred?.token ?? "");
      if (!token) return null;
      const claims = await verificarTokenHub(token);
      if (!claims || claims.nivel === "bloqueado") return null;
      const papel = nivelParaPapel(claims.nivel);
      const { setorSlug, setorNome } = await resolverSetor(claims.setorId);
      await sincronizarUsuario(claims, papel, setorNome);
      return {
        id: claims.sub,
        email: claims.email,
        name: claims.nome,
        papel,
        setorId: claims.setorId,
        setorNome,
        setorSlug,
      };
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      // Ambos os providers (dev e hub-sso) já entregam papel/setor resolvidos no `user`.
      if (user && (user as { papel?: Papel }).papel) {
        const u = user as {
          papel?: Papel;
          setorId?: string | null;
          setorNome?: string | null;
          setorSlug?: string | null;
        };
        token.papel = u.papel;
        token.setorId = u.setorId ?? null;
        token.setorNome = u.setorNome ?? null;
        token.setorSlug = u.setorSlug ?? null;
      }
      if (!token.papel) token.papel = "MEMBRO";
      return token;
    },
    async session({ session, token }) {
      session.user.papel = (token.papel as Papel) ?? "MEMBRO";
      session.user.setorId = (token.setorId as string | null) ?? null;
      session.user.setorNome = (token.setorNome as string | null) ?? null;
      session.user.setorSlug = (token.setorSlug as string | null) ?? null;
      return session;
    },
  },
});
