import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config administration routes (TB-406 / TB-522 / TB-751)", () => {
  it("keeps permanent redirects for legacy administration URLs", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules).toBeDefined();

    expect(
      redirectRules?.find(
        (rule) =>
          rule.source === "/workspace/security-trust"
          && rule.destination === "/administration/settings/security-trust",
      )?.permanent,
    ).toBe(true);

    expect(
      redirectRules?.find(
        (rule) => rule.source === "/admin/users" && rule.destination === "/administration/settings/users",
      )?.permanent,
    ).toBe(true);

    expect(
      redirectRules?.find(
        (rule) =>
          rule.source === "/settings/roles"
          && rule.destination === "/administration/settings/users?tab=roles",
      )?.permanent,
    ).toBe(true);
  });

  it("does not rewrite canonical administration URLs to legacy App Router trees (TB-751)", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(rewriteRules).toBeDefined();

    expect(
      rewriteRules?.some(
        (rule) =>
          rule.source === "/administration/settings/security-trust"
          || rule.source === "/administration/settings/security-trust/:path*",
      ),
    ).toBe(false);

    expect(
      rewriteRules?.some(
        (rule) => rule.source === "/administration/settings/users" || rule.source === "/administration/settings/users/:path*",
      ),
    ).toBe(false);

    expect(
      rewriteRules?.some(
        (rule) =>
          rule.source === "/administration/settings/support" || rule.source === "/administration/settings/support/:path*",
      ),
    ).toBe(false);
  });

  it("does not ship a redirect for retired /recommendation-learning bookmark", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((rule) => rule.source === "/recommendation-learning")).toBeUndefined();
  });
});
