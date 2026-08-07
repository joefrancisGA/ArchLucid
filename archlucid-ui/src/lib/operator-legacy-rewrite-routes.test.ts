import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

const RETIRED_BOOKMARK_REWRITE_SOURCES = [
  "/digests",
  "/digest-subscriptions",
  "/governance/risk-exceptions",
  "/governance/risk-exceptions/:path*",
  "/settings/roles",
] as const;

describe("operator next.config rewrites (IA batch 7)", () => {
  it("does not rewrite retired bookmark paths (orientation canonicalize only)", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    for (const source of RETIRED_BOOKMARK_REWRITE_SOURCES) {
      expect(rewriteRules?.find((rule) => rule.source === source)).toBeUndefined();
    }
  });

  it("keeps signed-record product deep-link rewrites", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(
      rewriteRules?.find(
        (rule) =>
          rule.source === "/architecture/reviews/claims-intake-modernization/signed-record"
          && rule.destination === "/governance/signed-records/a1c2e3f4-a5b6-7890-abcd-ef1234567890",
      ),
    ).toBeDefined();
    expect(
      rewriteRules?.find(
        (rule) =>
          rule.source === "/architecture/reviews/:id/signed-record"
          && rule.destination === "/architecture/reviews/:id",
      ),
    ).toBeDefined();
    expect(rewriteRules).toHaveLength(2);
  });
});
