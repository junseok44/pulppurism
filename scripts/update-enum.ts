import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateEnum() {
  try {
    const sql = readFileSync(
      join(__dirname, "../migrations/update_agenda_status_enum.sql"),
      "utf-8"
    );

    console.log("Updating agenda_status enum...");
    await pool.query(sql);
    console.log("✅ Enum updated successfully!");

    // Verify the enum values
    const result = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'agenda_status')
      ORDER BY enumsortorder;
    `);

    console.log("\nCurrent enum values:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.enumlabel}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating enum:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateEnum();

