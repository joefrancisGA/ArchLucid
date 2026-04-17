import { defineConfig, devices } from "@playwright/test";

/**
 * Mock-backed operator UI Playwright suite (loopback mock API on 18765).
 * On-demand: `npx playwright test -c playwright.mock.config.ts` or `npm run test:e2e:mock`.
 * Merge-blocking live journeys use the default `playwright.config.ts` in CI (`ui-e2e-live`).
 */
export default defineConfig({
  testDir: "e2e",
  testIgnore: "**/live-api-*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "npm run build && npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-with-mock.ts",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
