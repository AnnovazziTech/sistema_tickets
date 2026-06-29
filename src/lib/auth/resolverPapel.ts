import { query } from "@/lib/db";

export type Papel = "ADMIN" | "GESTOR" | "MEMBRO";
export type PapelResolvido = {
  papel: Papel;
  setorId: string | null;
  setorNome: string | null;
  nome: string | null;
  usuarioId: string | null;
};

// Setores cujos membros são administradores da plataforma (Controladoria e P&D).
const ADMIN_SETORES = ["controladoria", "p&d", "ped", "p&d / produtividade", "produtividade"];

const MEMBRO: PapelResolvido = {
  papel: "MEMBRO",
  setorId: null,
  setorNome: null,
  nome: null,
  usuarioId: null,
};

type UsuarioRow = {
  id: string;
  nome: string;
  nivel_acesso: string | null;
  setor_id: string | null;
  setor_nome: string | null;
};

/**
 * Resolve o papel de um usuário a partir do diretório corporativo (sistema_ata) e
 * sincroniza a projeção local (tickets.usuarios). ADMIN = nivel 'admin' ou setor
 * Controladoria/P&D; GESTOR = nivel 'gestor' ou consta em gestores_setores. Best-effort:
 * em falha de banco devolve MEMBRO (sem derrubar o login).
 */
export async function resolverPapel(email: string): Promise<PapelResolvido> {
  try {
    const rows = await query<UsuarioRow>(
      `SELECT u.id, u.nome, u.nivel_acesso, u.setor_id, s.nome AS setor_nome
         FROM sistema_ata.usuarios u
         LEFT JOIN sistema_ata.setores s ON s.id = u.setor_id
        WHERE lower(u.email) = lower($1) AND u.ativo
        LIMIT 1`,
      [email],
    );
    const u = rows[0];
    if (!u) return MEMBRO;

    const setorNorm = (u.setor_nome ?? "").trim().toLowerCase();
    let papel: Papel = "MEMBRO";
    if (u.nivel_acesso === "admin" || ADMIN_SETORES.includes(setorNorm)) {
      papel = "ADMIN";
    } else {
      const gestor = await query(
        `SELECT 1 FROM sistema_ata.gestores_setores WHERE gestor_id = $1 LIMIT 1`,
        [u.id],
      );
      if (u.nivel_acesso === "gestor" || gestor.length > 0) papel = "GESTOR";
    }

    await query(
      `INSERT INTO tickets.usuarios (id, email, nome, setor_id, setor_nome, papel, nivel_acesso, sincronizado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email, nome = EXCLUDED.nome, setor_id = EXCLUDED.setor_id,
             setor_nome = EXCLUDED.setor_nome, papel = EXCLUDED.papel,
             nivel_acesso = EXCLUDED.nivel_acesso, sincronizado_em = now()`,
      [u.id, email.toLowerCase(), u.nome, u.setor_id, u.setor_nome, papel, u.nivel_acesso],
    );

    return { papel, setorId: u.setor_id, setorNome: u.setor_nome, nome: u.nome, usuarioId: u.id };
  } catch (err) {
    console.error("[resolverPapel]", err);
    return MEMBRO;
  }
}
