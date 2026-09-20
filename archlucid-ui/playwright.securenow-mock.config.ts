import { defineConfig, devices } from "@playwright/test";

/**
 * SecureNow product line mock E2E — full operator shell, security build (`NEXT_PUBLIC_ARCHLUCID_PRODUCT=security`).
 *
 * Run: `npm run securenow-ui-rate:screenshots`
 */
const mockE2eSkipNextBuild = process.env.MOCK_E2E_SKIP_NEXT_BUILD === "1";
const mockWebServerCommand = mockE2eSkipNextBuild
  ? "npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-with-mock.ts"
  : "npm run build && npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-with-mock.ts";

const mockE2ePort = process.env.MOCK_E2E_SECURENOW_PORT ?? "3004";
const mockBaseUrl = `http://127.0.0.1:${mockE2ePort}`;

const mockWebServerStartupTimeoutMs = 45 * 60 * 1_000;

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
      name: "chromium-securenow-ui-rate",
      testDir: "e2e",
      testMatch: ["securenow-ui-rate-screenshots.spec.ts"],
      testIgnore: ["**/.next/**"],
      timeout: 180_000,
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
      MOCK_AUTH_ME_ROLE: "Operator",
    },
  },
});
