import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

/**
 * Catches Node ESM / JSON import loader failures before Playwright reports "No tests found"
 * on `live-api-private-beta-access.spec.ts` (see PRIVATE_BETA_TRUNK_SMOKE.md).
 */
describe("live-api-private-beta-access loader smoke", () => {
  it("loads private-beta e2e helper modules without Node ESM resolution errors", async () => {
    await import("./helpers/live-private-beta-access");
    await import("./helpers/live-api-client");
    await import("./helpers/operator-journey");
    await import("./helpers/live-page-readiness");
    await import("./helpers/private-beta-simplified-pilot-wizard");
    await import("./fixtures");
  });

  it("asserts the Reviews hub page-title test id instead of a stale H2 locator", async () => {
    const readiness = await import("./helpers/live-page-readiness");

    expect(readiness.LIVE_REVIEWS_HUB_TITLE_TEST_ID).toBe("reviews-hub-page-title");

    const source = readFileSync(join(process.cwd(), "e2e/helpers/live-page-readiness.ts"), "utf8");

    expect(source).toContain("getByTestId(LIVE_REVIEWS_HUB_TITLE_TEST_ID)");
    expect(source).not.toContain('getByRole("heading", { level: 2, name: /^Reviews$/i })');
  });

  it("opens the simplified wizard with path=detailed so Working DA-09 does not redirect", async () => {
    const wizard = await import("./helpers/private-beta-simplified-pilot-wizard");

    expect(wizard.PRIVATE_BETA_SIMPLIFIED_PILOT_WIZARD_HREF).toBe(
      "/architecture/reviews/new?path=detailed&baseline=1",
    );

    const source = readFileSync(
      join(process.cwd(), "e2e/helpers/private-beta-simplified-pilot-wizard.ts"),
      "utf8",
    );

    expect(source).toContain("waitAndDismissFirstSessionPurposeChooser");
    expect(source).toContain("isArchitectureRequestCreateResponse");
    expect(source).toContain("readCreatedRunIdFromArchitectureRequestCreate");
    expect(source).toContain("uniquePrivateBetaSystemName");
    expect(source).toContain("ensureSimplifiedPilotEnvironmentSelected");
    expect(source).not.toContain("waitForAsyncWizardRun");
    expect(source).not.toContain("interpretWizardCreateOperation");
  });

  it("matches async 202 create POSTs without requiring a JSON body", async () => {
    const createResponse = await import("./helpers/architecture-request-create-response");

    expect(
      createResponse.isArchitectureRequestCreateResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/request/async",
        method: "POST",
      }),
    ).toBe(true);

    expect(
      createResponse.readCreatedRunIdFromArchitectureRequestCreate({
        status: 202,
        bodyText: "",
        location: "/v1/operations/run:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      }),
    ).toBe("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
  });

  it("loads the sandbox mock chain used by live-e2e Next bundles", async () => {
    await import("@/lib/api/http-verbs-get");
    await import("@/lib/sandbox-api-mocks");
  });

  it("private-beta spec declares per-test Playwright timeout wiring", () => {
    const spec = readFileSync(join(process.cwd(), "e2e/live-api-private-beta-access.spec.ts"), "utf8");

    expect(spec).toContain("liveE2ePrivateBetaAccessPlaywrightTimeoutMs");
    expect(spec).toContain("live-api-private-beta-access");
    expect(spec).toContain("fetchAuthMeWithBearer");
    expect(spec).toContain("warmPrivateBetaCreateRunPipeline");
    expect(spec).toContain("test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs())");
    expect(spec).toContain("test.describe.configure({ timeout: liveE2ePrivateBetaAccessPlaywrightTimeoutMs() })");
    expect(spec).toMatch(
      /test\.beforeAll\(async \(\{ request \}\) => \{\s*test\.setTimeout\(liveE2ePrivateBetaAccessPlaywrightTimeoutMs\(\)\)/,
    );
  });

  it("release-gate spine assertions scope repeated honesty-chip test ids", () => {
    const spec = readFileSync(join(process.cwd(), "e2e/demo-workspace-a.smoke.spec.ts"), "utf8");

    expect(spec).toContain("const spineBand = page.getByTestId(\"run-detail-first-review-spine-band\")");
    expect(spec).toContain(
      "spineBand.getByTestId(\"policy-pack-influence-honesty-chip\")",
    );
  });

  it("private-beta create-run HTTP timeout exceeds inline pipeline budget", async () => {
    const previousPrivateBeta = process.env.LIVE_E2E_PRIVATE_BETA_ACCESS;
    const previousCi = process.env.CI;

    process.env.LIVE_E2E_PRIVATE_BETA_ACCESS = "1";
    process.env.CI = "true";
    vi.resetModules();

    try {
      const client = await import("./helpers/live-api-client");

      expect(client.LIVE_E2E_PRIVATE_BETA_CREATE_RUN_HTTP_TIMEOUT_MS).toBeGreaterThanOrEqual(420_000);
      expect(client.liveE2eArchitectureRequestAttemptHttpTimeoutMs()).toBe(
        client.LIVE_E2E_PRIVATE_BETA_CREATE_RUN_HTTP_TIMEOUT_MS,
      );
    } finally {
      if (previousPrivateBeta === undefined) {
        delete process.env.LIVE_E2E_PRIVATE_BETA_ACCESS;
      } else {
        process.env.LIVE_E2E_PRIVATE_BETA_ACCESS = previousPrivateBeta;
      }

      if (previousCi === undefined) {
        delete process.env.CI;
      } else {
        process.env.CI = previousCi;
      }

      vi.resetModules();
    }
  });
});
