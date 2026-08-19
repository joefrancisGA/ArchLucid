import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

import {
  isLoopbackAcceptanceTarget,
  resolveAcceptanceBaseUrl,
  resolveAcceptanceStorageState,
} from "./e2e/helpers/acceptance-base-url";

/**
 * Founder acceptance lane (GTM M-96–M-98): small tagged suite against an owner-chosen UI origin.
 *
 * Env:
 * - ACCEPTANCE_BASE_URL (canonical) or STAGING_BASE_URL (alias)
 * - ACCEPTANCE_STORAGE_STATE — optional path to Playwright storageState JSON
 * - LIVE_API_URL / LIVE_API_KEY / JWT env — same as live E2E for API-backed @founder specs
 * - ACCEPTANCE_SKIP_LIVE_INFRA=1 — skip SQL/API readiness probe (public/marketing-only runs)
 * - ACCEPTANCE_NO_WEBSERVER=1 — do not start Next even on loopback (reuse an already-running UI)
 *
 * Run: `npm run test:e2e:founder` (grep @founder). See FOUNDER_UI_ACCEPTANCE_ROUTINE.md.
 */
const baseURL = resolveAcceptanceBaseUrl();
const storageState = resolveAcceptanceStorageState();
const loopback = isLoopbackAcceptanceTarget(baseURL);
const skipNextBuild = process.env.LIVE_E2E_SKIP_NEXT_BUILD === "1";
const skipLiveInfraProbe = process.env.ACCEPTANCE_SKIP_LIVE_INFRA === "1";
const startWebServer = loopback && process.env.ACCEPTANCE_NO_WEBSERVER !== "1";

const liveWebServerCommand = skipNextBuild
  ? "npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-live-api.ts"
  : "npm run build && npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-live-api.ts";

const config: PlaywrightTestConfig = {
  testDir: "e2e",
  /**
   * Prefer tagging existing live/demo/marketing specs over a parallel suite.
   * npm scripts pass `--grep @founder` (or `@critical`).
   */
  testMatch: [
    "live-api-*.spec.ts",
    "demo-workspace-*.smoke.spec.ts",
    "marketing-*.spec.ts",
    "showcase-*.spec.ts",
    "finding-evidence-deep-links.spec.ts",
    "first-run-wizard.spec.ts",
    "buyer-golden-path.smoke.spec.ts",
    "founder-*.spec.ts",
  ],

  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never", outputFolder: "playwright-report-founder" }]]
    : "list",
  use: {
    baseURL,
    ...(storageState ? { storageState } : {}),
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
};

if (!skipLiveInfraProbe) {
  config.globalSetup = require.resolve("./e2e/global-setup-live-api-infra.ts");
}

if (startWebServer) {
  config.webServer = {
    command: liveWebServerCommand,
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: skipNextBuild ? 120_000 : 600_000,
    env: {
      LIVE_API_URL: process.env.LIVE_API_URL ?? "http://127.0.0.1:5128",
      ARCHLUCID_API_KEY: process.env.ARCHLUCID_API_KEY ?? process.env.LIVE_API_KEY ?? "",
      ARCHLUCID_PROXY_BEARER_TOKEN:
        process.env.ARCHLUCID_PROXY_BEARER_TOKEN ?? process.env.LIVE_JWT_TOKEN ?? "",
      ARCHLUCID_PROXY_ALLOW_CLIENT_SCOPE_HEADERS: "true",
      NEXT_PUBLIC_SUPPRESS_ONBOARDING_TOUR: "1",
    },
  };
}

export default defineConfig(config);
