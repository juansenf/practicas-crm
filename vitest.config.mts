import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // En tests no hay runtime de React Server Components: se reemplaza el
      // guard de "server-only" por un módulo vacío.
      "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    // Las pruebas de integración comparten una única base de datos.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/modules/**", "src/lib/**"],
      exclude: [
        "**/*.test.ts",
        "src/generated/**",
        "src/modules/**/repository.prisma.ts",
      ],
    },
  },
});
