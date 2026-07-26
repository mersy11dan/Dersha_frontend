import mysql from "mysql2/promise";
import { env } from "../config/env";

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // DECIMAL columns arrive as strings by default. Money and share quantities are
  // parsed explicitly at the repository boundary rather than being coerced to
  // floats here, so precision is never silently lost.
  decimalNumbers: false,
  timezone: "Z",
});

export async function assertDatabaseConnection(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

export default pool;
