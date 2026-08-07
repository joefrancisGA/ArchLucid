import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config administration routes (TB-406 / TB-522 / TB-751)", () => {
  it("does not ship permanent bookmark redirects", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules ?? []).toEqual([]);
  });

  it("rewrites legacy /settings/roles to the users hub without a permanent redirect", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(rewriteRules).toBeDefined();
    expect(
      rewriteRules?.find(
        (rule) =>
          rule.source === "/settings/roles"
          && rule.destination === "/administration/users?tab=roles",
      ),
    ).toBeDefined();
  });

  it("does not rewrite canonical architecture URLs to phantom on-disk trees", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(rewriteRules).toBeDefined();
    expect(rewriteRules?.some((rule) => rule.source === "/architecture/architectures")).toBe(false);
    expect(rewriteRules?.some((rule) => rule.source === "/architecture/architectures/:path*")).toBe(false);
    expect(rewriteRules?.some((rule) => rule.source === "/architecture/reviews")).toBe(false);
    expect(rewriteRules?.some((rule) => rule.source === "/architecture/reviews/:path*")).toBe(false);
    expect(
      rewriteRules?.find((rule) => rule.source === "/architecture/reviews/:id/signed-record")?.destination,
    ).toBe("/architecture/reviews/:id");
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

  it("rewrites legacy digests and exceptions bookmarks instead of 301 redirects", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

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
    expect(
      rewriteRules?.find(
        (rule) =>
          rule.source === "/governance/risk-exceptions"
          && rule.destination === "/governance/exceptions",
      ),
    ).toBeDefined();
  });
});
