"use client";

import * as Icons from "lucide-react";
import { HelpCircle, type LucideProps } from "lucide-react";

/** Resolve um ícone lucide pelo nome (string), com fallback seguro. */
export function IconeDinamico({ nome, ...props }: { nome: string } & LucideProps) {
  const Comp =
    (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[nome] ?? HelpCircle;
  return <Comp {...props} />;
}
