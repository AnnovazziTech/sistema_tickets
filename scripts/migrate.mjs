// Executa as migrações SQL em db/migrations contra o DATABASE_URL.
// Sem dependências além de `pg`: carrega .env.local / .env manualmente.
//
//   npm run migrate
//
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// --- carregamento simples de .env (sem dependência de dotenv) ---
function loadEnv(file) {
  const path = join(root, file);
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv(".env.local");
loadEnv(".env");

if (!process.env.DATABASE_URL) {
  console.error(
    "✗ DATABASE_URL não configurada. Copie .env.example para .env.local e preencha a conexão do dwfaj.",
  );
  process.exit(1);
}

const migrationsDir = join(root, "db", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : undefined,
});

try {
  await client.connect();
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`→ aplicando ${file} ...`);
    await client.query(sql);
    console.log(`✓ ${file}`);
  }
  console.log("✓ Migrações concluídas.");
} catch (err) {
  console.error("✗ Falha ao migrar:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
