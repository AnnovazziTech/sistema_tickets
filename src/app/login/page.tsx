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
  const entraAtivo = !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID;

  return (
    <div className="mx-auto max-w-md pt-6">
      <PageHeader titulo="Acessar" subtitulo="Tickets FAJ — Gente & Gestão" icone={Lock} />
      <Card>
        <LoginForm devAtivo={devAtivo} entraAtivo={entraAtivo} callbackUrl={callbackUrl || "/"} />
      </Card>
    </div>
  );
}
