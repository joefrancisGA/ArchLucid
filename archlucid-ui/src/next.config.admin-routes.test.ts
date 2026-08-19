import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config administration routes (TB-406 / TB-522 / TB-751)", () => {
  it("does not ship permanent bookmark redirects (IA batch 4)", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules ?? []).toEqual([]);
  });

  it("does not rewrite legacy bookmark paths (IA batch 7)", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(rewriteRules).toBeDefined();
    expect(rewriteRules?.find((rule) => rule.source === "/settings/roles")).toBeUndefined();
    expect(rewriteRules?.find((rule) => rule.source === "/digests")).toBeUndefined();
    expect(rewriteRules?.find((rule) => rule.source === "/digest-subscriptions")).toBeUndefined();
    expect(rewriteRules?.find((rule) => rule.source === "/governance/risk-exceptions")).toBeUndefined();
  });

  it("does not rewrite canonical architecture URLs to phantom on-disk trees", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(rewriteRules ?? []).toEqual([]);
    expect(rewriteRules?.some((rule) => rule.source === "/architecture/architectures")).toBe(false);
    expect(rewriteRules?.some((rule) => rule.source === "/architecture/architectures/:path*")).toBe(false);
    expect(rewriteRules?.some((rule) => rule.source === "/architecture/reviews")).toBe(false);
    expect(rewriteRules?.some((rule) => rule.source === "/architecture/reviews/:path*")).toBe(false);
    expect(rewriteRules?.find((rule) => rule.source === "/architecture/reviews/:id/sealed-record")).toBeUndefined();
  });

  it("does not rewrite canonical administration URLs to legacy App Router trees (TB-751)", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(rewriteRules).toBeDefined();

    expect(
      rewriteRules?.some(
        (rule) =>
          rule.source === "/administration/security-trust"
          || rule.source === "/administration/security-trust/:path*",
      ),
    ).toBe(false);

    expect(
      rewriteRules?.some(
        (rule) => rule.source === "/administration/users" || rule.source === "/administration/users/:path*",
      ),
    ).toBe(false);

    expect(
      rewriteRules?.some(
        (rule) =>
          rule.source === "/administration/support" || rule.source === "/administration/support/:path*",
      ),
    ).toBe(false);
  });
});
