import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontido para container (Docker/Hetzner).
  output: "standalone",
  // Dependências apenas de servidor (route handlers + Server Components).
  // Garante que o bundler não tente empacotá-las no cliente.
  serverExternalPackages: ["pg", "nodemailer"],
};

export default nextConfig;
