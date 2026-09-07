import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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
    expect(spec).toContain("test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs())");
  });
});
