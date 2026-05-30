import { defineConfig, devices } from "@playwright/test";

/**
 * Full-operator-shell mock E2E (no buyer-polished demo flags at build time).
 * Progressive disclosure controls ("Show all features", Sidebar layout toggles) are hidden when
 * `NEXT_PUBLIC_DEMO_MODE` / `NEXT_PUBLIC_DEMO_STATIC_OPERATOR` force buyer-polished shell — see
 * `playwright.mock.config.ts` for the default mock suite.
 *
 * Run: `npx playwright test -c playwright.operator-mock.config.ts`
 * CI: rebuild with operator env before `MOCK_E2E_SKIP_NEXT_BUILD=1` (see `.github/workflows/ci.yml`).
 */
const mockE2eSkipNextBuild = process.env.MOCK_E2E_SKIP_NEXT_BUILD === "1";
const mockWebServerCommand = mockE2eSkipNextBuild
  ? "npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-with-mock.ts"
  : "npm run build && npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-with-mock.ts";

const mockE2ePort = process.env.MOCK_E2E_OPERATOR_PORT ?? "3002";
const mockBaseUrl = `http://127.0.0.1:${mockE2ePort}`;

const mockWebServerStartupTimeoutMs = 30 * 60 * 1_000;

export default defineConfig({
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: mockBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-operator-shell",
      testDir: "e2e",
      testMatch: ["pilot-nav-profile.spec.ts"],
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: mockWebServerCommand,
    url: mockBaseUrl,
    reuseExistingServer: process.env.MOCK_E2E_REUSE_SERVER === "1",
    timeout: mockWebServerStartupTimeoutMs,
    env: {
      ...process.env,
      PORT: mockE2ePort,
      NEXT_PUBLIC_SUPPRESS_ONBOARDING_TOUR: "1",
      NEXT_PUBLIC_OPERATOR_EXPERIENCE: "operator",
      NEXT_PUBLIC_DEMO_MODE: "false",
      NEXT_PUBLIC_DEMO_STATIC_OPERATOR: "false",
      NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES: "1",
    },
  },
});
