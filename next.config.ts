import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dependências apenas de servidor (route handlers + Server Components).
  // Garante que o bundler não tente empacotá-las no cliente.
  serverExternalPackages: ["pg", "nodemailer"],
};

export default nextConfig;
