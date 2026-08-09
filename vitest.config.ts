import { defineConfig } from "vitest/config";
import path from "node:path";

// SQLite resuelve rutas relativas en DATABASE_URL de forma inconsistente
// según el comando (CLI vs cliente generado), así que para las pruebas
// usamos siempre una ruta absoluta a un archivo de base de datos separado
// del de desarrollo (prisma/test.db, no versionado, ver .gitignore).
const TEST_DATABASE_URL = `file:${path.resolve(__dirname, "prisma/test.db")}`;

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: "./tests/global-setup.ts",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    // Todos los archivos de prueba comparten la misma SQLite de pruebas
    // (prisma/test.db) y cada uno limpia las tablas en beforeEach; correr
    // los archivos en paralelo produce condiciones de carrera entre ellos.
    fileParallelism: false,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      AUTH_SECRET: "test-secret",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
