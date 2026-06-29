// Semeia/atualiza os formulários iniciais (DHO/movimentação) no banco a partir do
// JSON canônico em src/lib/forms/seed/*.json. Idempotente.
//
//   npm run seed
//
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv(".env.local");
loadEnv(".env");

if (!process.env.DATABASE_URL) {
  console.error("✗ DATABASE_URL não configurada. Copie .env.example para .env.local.");
  process.exit(1);
}

const SEEDS = ["dho"];

// Setores canônicos da FAJ (idempotente). O DHO também é (re)criado pelo seed do formulário.
const SETORES_CANONICOS = [
  { slug: "comercial", nome: "Comercial", icone: "ShoppingCart" },
  { slug: "relacionamento", nome: "Relacionamento", icone: "Headphones" },
  { slug: "dho", nome: "DHO", icone: "Users" },
  { slug: "obras", nome: "Obras", icone: "Building2" },
  { slug: "controladoria", nome: "Controladoria", icone: "Calculator" },
  { slug: "ped", nome: "P&D", icone: "Cpu" },
  { slug: "ti", nome: "Tecnologia", icone: "Network" },
  { slug: "suprimentos", nome: "Suprimentos", icone: "Boxes" },
  { slug: "marketing", nome: "Marketing", icone: "Megaphone" },
  { slug: "financeiro", nome: "Financeiro", icone: "Banknote" },
];

async function semearSetores(client) {
  for (const s of SETORES_CANONICOS) {
    await client.query(
      `INSERT INTO tickets.setores (slug, nome, icone, cor)
       VALUES ($1, $2, $3, '#162763')
       ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome, icone = EXCLUDED.icone`,
      [s.slug, s.nome, s.icone],
    );
  }
  console.log(`✓ ${SETORES_CANONICOS.length} setores canônicos`);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : undefined,
});

async function semear(seed) {
  const { setor, formulario, sla, definicao } = seed;

  const setorId = (
    await client.query(
      `INSERT INTO tickets.setores (slug, nome, icone, cor)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome, icone = EXCLUDED.icone, cor = EXCLUDED.cor
       RETURNING id`,
      [setor.slug, setor.nome, setor.icone, setor.cor],
    )
  ).rows[0].id;

  const formId = (
    await client.query(
      `INSERT INTO tickets.formularios (setor_id, slug, nome, descricao, icone, prefixo_protocolo)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (setor_id, slug) DO UPDATE
         SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao,
             icone = EXCLUDED.icone, prefixo_protocolo = EXCLUDED.prefixo_protocolo,
             updated_at = now()
       RETURNING id`,
      [setorId, formulario.slug, formulario.nome, formulario.descricao, formulario.icone, formulario.prefixo],
    )
  ).rows[0].id;

  const versaoId = (
    await client.query(
      `INSERT INTO tickets.formulario_versoes (formulario_id, versao, definicao, status, publicado_em)
       VALUES ($1, 1, $2::jsonb, 'publicada', now())
       ON CONFLICT (formulario_id, versao) DO UPDATE
         SET definicao = EXCLUDED.definicao, status = 'publicada', publicado_em = now()
       RETURNING id`,
      [formId, JSON.stringify(definicao)],
    )
  ).rows[0].id;

  await client.query(`UPDATE tickets.formularios SET versao_publicada_id = $1 WHERE id = $2`, [versaoId, formId]);

  // SLA padrão (tipo NULL): regrava de forma idempotente.
  await client.query(`DELETE FROM tickets.sla_config WHERE formulario_id = $1 AND tipo IS NULL`, [formId]);
  await client.query(
    `INSERT INTO tickets.sla_config (formulario_id, tipo, prioridade, tempo_primeira_resposta_min, tempo_resolucao_min)
     VALUES ($1, NULL, $2, $3, $4)`,
    [formId, sla.prioridade ?? 0, sla.tempo_primeira_resposta_min, sla.tempo_resolucao_min],
  );

  console.log(`✓ ${setor.slug}/${formulario.slug} (formulario ${formId}, versão ${versaoId})`);
}

try {
  await client.connect();
  await semearSetores(client);
  for (const nome of SEEDS) {
    const seed = JSON.parse(readFileSync(join(root, "src", "lib", "forms", "seed", `${nome}.json`), "utf8"));
    await semear(seed);
  }
  console.log("✓ Seed concluído.");
} catch (err) {
  console.error("✗ Falha no seed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
