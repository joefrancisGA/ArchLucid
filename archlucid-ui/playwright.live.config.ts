import { defineConfig, devices } from "@playwright/test";

/**
 * Live ArchLucid API + real SQL (CI only by default). Does not start the mock server.
 * Set LIVE_API_URL to the running API base (e.g. http://127.0.0.1:5128).
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "live-api-journey.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-live-api.ts",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      LIVE_API_URL: process.env.LIVE_API_URL ?? "http://127.0.0.1:5128",
    },
  },
});
