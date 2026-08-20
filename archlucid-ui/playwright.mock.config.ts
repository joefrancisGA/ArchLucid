import { defineConfig, devices } from "@playwright/test";

/**
 * Mock-backed operator UI Playwright suite (loopback mock API on 18765).
 * On-demand: `npx playwright test -c playwright.mock.config.ts` or `npm run test:e2e:mock`.
 * Merge-blocking live journeys use the default `playwright.config.ts` in CI (`ui-e2e-live`).
 *
 * If `MOCK_E2E_SKIP_NEXT_BUILD=1`, the webServer only runs `start-e2e-with-mock` (assumes `npm run build` already ran).
 * By default the UI port is **not** reused (avoids screenshot/E2E hitting the wrong process on 3000). Set
 * `MOCK_E2E_REUSE_SERVER=1` to reuse an existing listener when you intentionally run standalone yourself.
 * After a one-time `npm run build`, prefer `npm run screenshots:all:prebuilt` to avoid the webServer re-running
 * a full build (faster, clearer failures). PNGs for `capture-all` land under `public/screenshots/all-routes/`.
 * `screenshots:all` / `screenshots:all:prebuilt` pass `--workers=50%` so route screenshots run in parallel (CLI overrides `workers` below).
 */
const mockE2eSkipNextBuild = process.env.MOCK_E2E_SKIP_NEXT_BUILD === "1";
const mockWebServerCommand = mockE2eSkipNextBuild
  ? "npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-with-mock.ts"
  : "npm run build && npx tsx --tsconfig e2e/tsconfig.json e2e/start-e2e-with-mock.ts";

/** When 3000 is taken (e.g. another dev server), set `MOCK_E2E_PORT=3001` and `PORT=3001`. */
const mockE2ePort = process.env.MOCK_E2E_PORT ?? process.env.PORT ?? "3000";
const mockBaseUrl = `http://127.0.0.1:${mockE2ePort}`;
const mockApiPort = process.env.E2E_MOCK_API_PORT ?? "18765";
const mockApiBaseUrl = `http://127.0.0.1:${mockApiPort}`;

/** Time until `webServer` URL responds. Large copies + cold Node + AV can exceed 10m even without `npm run build`. */
const mockWebServerStartupTimeoutMs = 30 * 60 * 1_000;

export default defineConfig({
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: mockBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testDir: ".",
      testMatch: [
        "e2e/**/*.spec.ts",
        "tests/quick-scan.spec.ts",
        "tests/core-pilot-path.spec.ts",
        "tests/compare.spec.ts",
        "tests/onboarding.spec.ts",
      ],
      testIgnore: [
        "**/live-api-*.spec.ts",
        "**/demo-workspace-*.smoke.spec.ts",
        "**/pilot-nav-profile.spec.ts",
        "**/ux-audit-screenshots.spec.ts",
        "**/capture-why-hero-operator-home-screenshot.spec.ts",
        "**/.next/**",
        "tests/e2e/**",
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    /** axe-core + WCAG 2.1 A/AA tagging — `npm run test:e2e:accessibility` (CI job `ui-playwright-accessibility`). */
    {
      name: "chromium-accessibility",
      testDir: "tests",
      testMatch: ["accessibility.spec.ts"],
      testIgnore: ["**/live-api-*.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    /**
     * Full-page screenshot goldens (`tests/e2e/visual-regression.spec.ts`). Snapshots are OS-specific
     * (`*-chromium-visual-win32.png` vs `*-linux.png`). Not run in merge-blocking CI — run locally or in Docker
     * (`scripts/update-visual-snapshots-docker.ps1`) when updating baselines.
     */
    /** Persona UX audit — buyer-polished shell; `npm run ux-audit:screenshots:buyer`. */
    {
      name: "chromium-ux-audit-buyer",
      testDir: "e2e",
      testMatch: ["ux-audit-screenshots.spec.ts"],
      testIgnore: ["**/.next/**"],
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"] },
    },
    /** Public marketing entry points — `npm run ux-audit:screenshots:marketing`. */
    {
      name: "chromium-ux-audit-marketing",
      testDir: "e2e",
      testMatch: ["ux-audit-screenshots.spec.ts"],
      testIgnore: ["**/.next/**"],
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"] },
    },
    /** `/why` hero operator Home PNG — `npm run capture:why-hero-operator-home` (TB-2301). */
    {
      name: "chromium-capture-why-hero",
      testDir: "e2e",
      testMatch: ["capture-why-hero-operator-home-screenshot.spec.ts"],
      testIgnore: ["**/.next/**"],
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-visual",
      testDir: "tests/e2e",
      /** Full-page screenshots + mock webServer warm-up can exceed the default 30s on busy agents. */
      timeout: 60_000,
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/*.spec.ts",
    },
  ],
  webServer: {
    command: mockWebServerCommand,
    url: mockBaseUrl,
    reuseExistingServer: process.env.MOCK_E2E_REUSE_SERVER === "1",
    /** Build + standalone sync can be slow; with skip-build, only the mock + Next need to start. */
    timeout: mockWebServerStartupTimeoutMs,
    env: {
      ...process.env,
      E2E_MOCK_API_PORT: mockApiPort,
      ARCHLUCID_API_BASE_URL: mockApiBaseUrl,
      NEXT_PUBLIC_SUPPRESS_ONBOARDING_TOUR: "1",
      /** Client bundle: hide dev-only chrome in mock E2E/screenshot runs when set at build time via local env. */
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? "true",
      /** Operator `/runs` / `/manifests` static fallback for demo parity with showcase when API is down. */
      NEXT_PUBLIC_DEMO_STATIC_OPERATOR: process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR ?? "true",
      /** CTO demo nav spine (#8): expand Graph / Governance / Audit without progressive disclosure. */
      NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED: process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED ?? "true",
      /** Let `capture-all-screenshots` deep-link `/product-learning`, `/recommendation-learning`, … without DemoStrictNavigationGate home redirects. */
      NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES: process.env.NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES ?? "1",
      /** Trial funnel mock specs expect public self-service signup UI (not invite-only gate). */
      NEXT_PUBLIC_PUBLIC_SIGNUP_MODE: process.env.NEXT_PUBLIC_PUBLIC_SIGNUP_MODE ?? "public-self-service",
      /** Mock CI has no acceptance storageState — skip authenticated founder routes that 404 without operator mocks. */
      FOUNDER_PUBLIC_ONLY: process.env.FOUNDER_PUBLIC_ONLY ?? "1",
    },
  },
});
