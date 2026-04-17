import { defineConfig, devices } from "@playwright/test";

/**
 * Default Playwright config: **live ArchLucid API + SQL** (operator journeys + live axe routes).
 * CI (`ui-e2e-live`) sets `LIVE_E2E_SKIP_NEXT_BUILD=1` after a separate `npm run build`.
 *
 * Mock-backed specs: `npx playwright test -c playwright.mock.config.ts`.
 */
const skipNextBuild = process.env.LIVE_E2E_SKIP_NEXT_BUILD === "1";
const liveWebServerCommand = skipNextBuild
  ? "npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-live-api.ts"
  : "npm run build && npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-live-api.ts";

export default defineConfig({
  testDir: "e2e",
  /** All `live-api-*.spec.ts` files share one worker and real SQL; keep naming when adding specs. */
  testMatch: ["live-api-*.spec.ts"],
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
    command: liveWebServerCommand,
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: skipNextBuild ? 120_000 : 180_000,
    env: {
      LIVE_API_URL: process.env.LIVE_API_URL ?? "http://127.0.0.1:5128",
      ARCHLUCID_PROXY_BEARER_TOKEN: process.env.ARCHLUCID_PROXY_BEARER_TOKEN ?? "",
    },
  },
});
