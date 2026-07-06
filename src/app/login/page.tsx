import { Lock } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const devAtivo = process.env.AUTH_DEV_LOGIN === "true";
  // Acesso corporativo é pelo Hub de Acesso FAJ: link direto para abrir este app via SSO.
  const hubBase = process.env.HUB_SSO_ISSUER ?? "https://sistemas.grupofaj.com.br";
  const slug = process.env.SSO_APP_SLUG ?? "tickets";
  const hubUrl = `${hubBase.replace(/\/$/, "")}/apps/${slug}/abrir`;

  return (
    <div className="mx-auto max-w-md pt-6">
      <PageHeader titulo="Acessar" subtitulo="Tickets FAJ — Gente & Gestão" icone={Lock} />
      <Card>
        <LoginForm devAtivo={devAtivo} hubUrl={hubUrl} callbackUrl={callbackUrl || "/"} />
      </Card>
    </div>
  );
}
