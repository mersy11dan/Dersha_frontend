import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { env } from "../config/env";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const BASE_SCHEMA = path.join(PROJECT_ROOT, "dirsha_db.sql");
const V2_MIGRATION = path.join(PROJECT_ROOT, "dirsha_db_v2.sql");

async function readSqlFile(file: string): Promise<string> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    throw new Error(`Could not read SQL file: ${file}`);
  }
}

async function main() {
  // Connect without selecting a database so the schema can be created if absent.
  const bootstrap = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
  );
  await bootstrap.end();

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
  });

  try {
    const [tables]: any = await connection.query(
      `SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ?`,
      [env.db.database],
    );
    const existing = new Set(
      tables.map((row: any) => String(row.t).toLowerCase()),
    );

    if (!existing.has("users")) {
      console.log("[migrate] base schema not found, applying dirsha_db.sql");
      await connection.query(await readSqlFile(BASE_SCHEMA));
      console.log("[migrate] base schema applied");
    } else {
      console.log("[migrate] base schema already present, skipping");
    }

    console.log("[migrate] applying dirsha_db_v2.sql");
    await connection.query(await readSqlFile(V2_MIGRATION));
    console.log("[migrate] v2 migration applied");

    const [verify]: any = await connection.query(
      `SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ?
       ORDER BY table_name`,
      [env.db.database],
    );
    console.log(
      `[migrate] ${verify.length} tables present: ${verify
        .map((r: any) => r.t)
        .join(", ")}`,
    );
  } finally {
    await connection.end();
  }
}

main()
  .then(() => {
    console.log("[migrate] done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[migrate] failed:", error.message ?? error);
    process.exit(1);
  });
