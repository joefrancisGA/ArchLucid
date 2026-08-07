import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("operator legacy rewrite routes (IA batch 3)", () => {
  it("rewrites digests bookmarks without permanent redirects", async () => {
    const redirectRules = await nextConfig.redirects?.();
    const rewriteRules = await nextConfig.rewrites?.();

    expect(redirectRules?.find((rule) => rule.source === "/digests")).toBeUndefined();
    expect(redirectRules?.find((rule) => rule.source === "/digest-subscriptions")).toBeUndefined();
    expect(
      rewriteRules?.find((rule) => rule.source === "/digests" && rule.destination === "/architecture/digests"),
    ).toBeDefined();
    expect(
      rewriteRules?.find(
        (rule) =>
          rule.source === "/digest-subscriptions"
          && rule.destination === "/architecture/digests?tab=subscriptions",
      ),
    ).toBeDefined();
  });

  it("rewrites legacy governance exceptions paths without permanent redirects", async () => {
    const redirectRules = await nextConfig.redirects?.();
    const rewriteRules = await nextConfig.rewrites?.();

    expect(redirectRules?.find((rule) => rule.source === "/governance/risk-exceptions")).toBeUndefined();
    expect(redirectRules?.find((rule) => rule.source === "/governance/risk-exceptions/:path*")).toBeUndefined();
    expect(
      rewriteRules?.find(
        (rule) =>
          rule.source === "/governance/risk-exceptions"
          && rule.destination === "/governance/exceptions",
      ),
    ).toBeDefined();
    expect(
      rewriteRules?.find(
        (rule) =>
          rule.source === "/governance/risk-exceptions/:path*"
          && rule.destination === "/governance/exceptions/:path*",
      ),
    ).toBeDefined();
  });
});
