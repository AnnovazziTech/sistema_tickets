import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { Provider } from "next-auth/providers";
import { resolverPapel, type Papel } from "@/lib/auth/resolverPapel";

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

// SSO Microsoft Entra ID (produção): habilitado quando as credenciais estão presentes.
if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, account }) {
      // Provider dev já entrega o papel/setor no `user`.
      if (user && (user as { papel?: Papel }).papel) {
        token.papel = (user as { papel?: Papel }).papel;
        token.setorSlug = (user as { setorSlug?: string | null }).setorSlug ?? null;
      }
      // SSO corporativo: resolve papel/setor a partir do diretório.
      if (account?.provider === "microsoft-entra-id" && token.email) {
        const r = await resolverPapel(token.email);
        token.papel = r.papel;
        token.setorId = r.setorId;
        token.setorNome = r.setorNome;
        token.setorSlug = r.setorSlug;
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
