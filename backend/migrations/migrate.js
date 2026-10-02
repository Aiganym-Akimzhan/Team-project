import { createPool, migrateAndSeed } from "./createTables.js";

const pool = createPool();
try {
  await migrateAndSeed(pool);
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
