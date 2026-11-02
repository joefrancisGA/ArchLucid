import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const srcRoot = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // Vite 8.1+ skips tsconfig path mapping for importers under tsconfig.json "exclude"
    // (`testing/` setup files). Keep an explicit alias so Vitest still resolves `@/`.
    alias: {
      "@": srcRoot,
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./testing/vitest-setup-rtl-mock.tsx", "./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.test.ts", "e2e/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    /** Default 5s is brittle for jsdom + RTL + axe under forked workers on slower machines. */
    testTimeout: 30_000,
  },
});
