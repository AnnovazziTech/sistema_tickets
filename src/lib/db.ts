import { Pool, type QueryResultRow } from "pg";

// Pool único reaproveitado entre hot-reloads no desenvolvimento.
declare global {
  // eslint-disable-next-line no-var
  var __dhoPool: Pool | undefined;
}

/** True se há DATABASE_URL configurada (permite curto-circuito silencioso sem banco). */
export function temBanco(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Retorna o pool de conexões, criando-o sob demanda. Lança erro apenas quando
 * efetivamente usado (não no import), para não quebrar o build sem DATABASE_URL.
 */
export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não configurada. Copie .env.example para .env.local e preencha a conexão do dwfaj.",
    );
  }
  if (!globalThis.__dhoPool) {
    globalThis.__dhoPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : undefined,
      max: 5,
    });
  }
  return globalThis.__dhoPool;
}

/** Executa uma query parametrizada e devolve as linhas. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params as unknown[]);
  return res.rows;
}
