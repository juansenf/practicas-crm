/**
 * Prepara la base de datos de integración local:
 *  1. Verifica que TEST_DATABASE_URL no apunte a la base de desarrollo.
 *  2. Crea la base si no existe (en servidores PostgreSQL reales).
 *  3. Aplica las migraciones versionadas sobre ella.
 *
 * Uso: npm run db:test:prepare
 *
 * Con `prisma dev` hay que levantar una segunda instancia aislada
 * (`npx prisma dev -d -n test`) y usar el puerto TCP que informa
 * `npx prisma dev ls`. La instancia local ignora el nombre de la base, por eso
 * la comprobación de seguridad se hace por contenido (usuarios del seed).
 */
import { spawnSync } from "node:child_process";
import "dotenv/config";
import { Client } from "pg";

const testUrl = process.env.TEST_DATABASE_URL;

if (!testUrl) {
  console.error(
    "Falta TEST_DATABASE_URL. Copiá el valor de .env.example y apuntalo a una base dedicada.",
  );
  process.exit(1);
}

const urlTest = new URL(testUrl);
const nombreBase = urlTest.pathname.replace(/^\//, "") || "postgres";

if (["postgres", "template0", "template1"].includes(nombreBase)) {
  console.error(
    `TEST_DATABASE_URL debe apuntar a una base dedicada (recibí "${nombreBase}").`,
  );
  process.exit(1);
}

// Mismo host y puerto que la base de desarrollo: solo es válido si el nombre
// de la base es distinto... pero con `prisma dev` el nombre se ignora, así que
// además se comprueba el contenido más abajo.
const urlDev = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
if (urlDev && urlDev.host === urlTest.host && urlDev.pathname === urlTest.pathname) {
  console.error(
    "TEST_DATABASE_URL es igual a DATABASE_URL: las pruebas borrarían los datos de desarrollo.",
  );
  process.exit(1);
}

// Crea la base en servidores PostgreSQL reales. En `prisma dev` es un no-op.
// Se hace antes de conectarse a la base de pruebas porque en un servidor nuevo
// (por ejemplo el servicio de PostgreSQL de GitHub Actions) todavía no existe.
const admin = new Client({
  connectionString: (() => {
    const u = new URL(testUrl);
    u.pathname = "/postgres";
    return u.toString();
  })(),
});

try {
  await admin.connect();
  const existe = await admin.query("select 1 from pg_database where datname = $1", [nombreBase]);
  if (existe.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${nombreBase}"`);
    console.log(`Base "${nombreBase}" creada.`);
  }
} catch {
  console.log("No se pudo conectar a la base administrativa; se asume que la base ya existe.");
} finally {
  await admin.end().catch(() => {});
}

const cliente = new Client({ connectionString: testUrl });
await cliente.connect();

const semilla = await cliente.query(
  "select email from usuarios where email like '%@nexo.local' limit 1",
).catch(() => ({ rows: [] }));

if (semilla.rows.length > 0) {
  console.error(
    `TEST_DATABASE_URL parece apuntar a la base de desarrollo (encontré "${semilla.rows[0].email}").\n` +
      "Con `prisma dev`, levantá una instancia aparte: npx prisma dev -d -n test",
  );
  await cliente.end();
  process.exit(1);
}

await cliente.end();

const resultado = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: testUrl },
});

if (resultado.status !== 0) {
  process.exit(resultado.status ?? 1);
}

console.log(`Migraciones aplicadas en "${nombreBase}".`);
