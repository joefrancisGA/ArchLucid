import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";

const RETIRED_BOOKMARK_REWRITE_SOURCES = [
  "/digests",
  "/digest-subscriptions",
  "/governance/risk-exceptions",
  "/governance/risk-exceptions/:path*",
  "/settings/roles",
  "/architecture/reviews/customer-intake-modernization/signed-record",
  "/architecture/reviews/:id/signed-record",
] as const;

describe("operator next.config rewrites (IA batch 7–8)", () => {
  it("ships no rewrites — canonical on-disk paths and product hrefs only", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(rewriteRules ?? []).toEqual([]);

    for (const source of RETIRED_BOOKMARK_REWRITE_SOURCES) {
      expect(rewriteRules?.find((rule) => rule.source === source)).toBeUndefined();
    }
  });
});
