import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Users } from "lucide-react";
import "./globals.css";
import { signOut } from "@/auth";
import { authAtivo, sessaoAtual } from "@/lib/auth/sessao";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tickets FAJ — Plataforma de Tickets",
  description: "Plataforma universal de tickets por setor — Grupo FAJ",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await sessaoAtual();

  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-10 border-b border-faj-border bg-faj-azul">
            <div className="mx-auto flex max-w-[1000px] items-center gap-2.5 px-6 py-3">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-faj)] bg-white/10 text-white">
                  <Users size={17} />
                </span>
                <div>
                  <p className="text-sm font-bold leading-tight text-white">Tickets FAJ</p>
                  <p className="text-[11px] leading-tight text-faj-azul-claro">Gente &amp; Gestão · Grupo FAJ</p>
                </div>
              </Link>

              <div className="ml-auto flex items-center gap-3 text-[12px]">
                {session?.user ? (
                  <>
                    <span className="text-faj-azul-claro">
                      {session.user.name}
                      {session.user.papel === "ADMIN" && (
                        <span className="ml-1.5 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          ADMIN
                        </span>
                      )}
                    </span>
                    {session.user.papel === "ADMIN" && (
                      <Link href="/admin/dashboard" className="font-semibold text-white hover:underline">
                        Admin
                      </Link>
                    )}
                    <form
                      action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/login" });
                      }}
                    >
                      <button className="font-semibold text-white hover:underline">Sair</button>
                    </form>
                  </>
                ) : authAtivo() ? (
                  <Link href="/login" className="font-semibold text-white hover:underline">
                    Entrar
                  </Link>
                ) : null}
              </div>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-[1000px] p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
