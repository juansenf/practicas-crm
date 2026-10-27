/**
 * Crea la base de datos de desarrollo en el PostgreSQL local de `prisma dev`.
 * Uso: node scripts/create-local-db.mjs
 */
import { Client } from "pg";

const adminUrl = process.env.ADMIN_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:51214/template1";
const dbName = process.env.DB_NAME ?? "practicas_crm";

const client = new Client({ connectionString: adminUrl });
await client.connect();

const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
if (exists.rowCount === 0) {
  await client.query(`CREATE DATABASE "${dbName}"`);
  console.log(`Base "${dbName}" creada.`);
} else {
  console.log(`La base "${dbName}" ya existe.`);
}

await client.end();
