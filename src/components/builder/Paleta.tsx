"use client";

import { CATALOGO, GRUPOS } from "@/lib/forms/catalogoComponentes";
import type { TipoCampo } from "@/lib/forms/tipos";
import { IconeDinamico } from "./IconeDinamico";

export function Paleta({ onAdd }: { onAdd: (tipo: TipoCampo) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-faj-texto-dim">Clique para adicionar à seção selecionada.</p>
      {GRUPOS.map((g) => (
        <div key={g}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-faj-texto-muted">{g}</p>
          <div className="grid grid-cols-2 gap-1">
            {CATALOGO.filter((c) => c.grupo === g).map((c) => (
              <button
                key={c.tipo}
                type="button"
                onClick={() => onAdd(c.tipo)}
                className="flex items-center gap-1.5 rounded-[var(--radius-faj)] border border-faj-border px-2 py-1.5 text-left text-xs text-faj-texto transition-colors hover:border-faj-azul-medio hover:bg-faj-bg-suave"
              >
                <IconeDinamico nome={c.icone} size={13} className="shrink-0 text-faj-azul-medio" />
                <span className="truncate">{c.rotulo}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
