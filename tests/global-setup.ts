import { execSync } from "node:child_process";
import path from "node:path";

// Se ejecuta una sola vez antes de toda la suite: sincroniza el esquema
// contra una base SQLite de pruebas separada de prisma/dev.db.
export default function globalSetup() {
  const databaseUrl = `file:${path.resolve(__dirname, "../prisma/test.db")}`;

  execSync("npx prisma db push --force-reset --skip-generate", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
}
