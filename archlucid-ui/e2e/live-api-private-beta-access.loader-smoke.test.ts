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
    await import("./fixtures");
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
