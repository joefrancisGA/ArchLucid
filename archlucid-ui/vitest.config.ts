import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./testing/vitest-setup-rtl-mock.tsx", "./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
    /** Default 5s is brittle for jsdom + RTL + axe under forked workers on slower machines. */
    testTimeout: 30_000,
  },
});
