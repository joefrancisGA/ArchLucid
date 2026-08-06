import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config administration routes (TB-406 / TB-522 / TB-751)", () => {
  it("keeps permanent redirects for legacy administration URLs", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules).toBeDefined();

    expect(
      redirectRules?.find(
        (rule) =>
          rule.source === "/administration/settings"
          && rule.destination === "/administration",
      )?.permanent,
    ).toBe(true);

    expect(
      redirectRules?.find(
        (rule) =>
          rule.source === "/workspace/security-trust"
          && rule.destination === "/administration/security-trust",
      )?.permanent,
    ).toBe(true);

    expect(
      redirectRules?.find(
        (rule) => rule.source === "/admin/users" && rule.destination === "/administration/users",
      )?.permanent,
    ).toBe(true);

    expect(redirectRules?.find((rule) => rule.source === "/settings/roles")).toBeUndefined();
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

  it("keeps permanent redirects for legacy alerts and value-report bookmarks", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((rule) => rule.source === "/alerts")?.destination).toBe("/governance/alerts");
    expect(redirectRules?.find((rule) => rule.source === "/alert-rules")?.destination).toBe(
      "/governance/alert-rules",
    );
    expect(redirectRules?.find((rule) => rule.source === "/value-report")?.destination).toBe(
      "/sponsor-report/executive-summary",
    );
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

  it("does not ship a redirect for retired /recommendation-learning bookmark", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((rule) => rule.source === "/recommendation-learning")).toBeUndefined();
  });
});
