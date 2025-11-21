import { drizzle } from "drizzle-orm/node-postgres"; // 여기 변경됨
import pg from "pg"; // 여기 변경됨
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Neon의 DATABASE_URL을 그대로 사용하면 됩니다.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });