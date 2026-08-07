import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config administration routes (TB-406 / TB-522 / TB-751)", () => {
  it("keeps permanent redirects for legacy administration URLs", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules).toBeDefined();

    expect(redirectRules?.some((rule) => rule.source === "/administration" && rule.destination === "/administration")).toBe(
      false,
    );
    expect(
      redirectRules?.some(
        (rule) => rule.source === "/administration/:path*" && rule.destination === "/administration/:path*",
      ),
    ).toBe(false);

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
    expect(redirectRules?.find((rule) => rule.source === "/policy-packs")?.destination).toBe(
      "/governance/policy-packs",
    );
    expect(redirectRules?.find((rule) => rule.source === "/value-report")?.destination).toBe(
      "/sponsor-report/executive-summary",
    );
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

  it("redirects legacy /runs to architecture reviews", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((rule) => rule.source === "/runs")?.destination).toBe("/architecture/reviews");
  });

  it("redirects legacy /dashboard to the canonical executive dashboard", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((rule) => rule.source === "/dashboard")?.destination).toBe(
      "/architecture/executive-dashboard",
    );
  });

  it("does not ship a redirect for retired /recommendation-learning bookmark", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((rule) => rule.source === "/recommendation-learning")).toBeUndefined();
  });

  it("rewrites legacy digests and exceptions bookmarks instead of 301 redirects", async () => {
    const redirectRules = await nextConfig.redirects?.();
    const rewriteRules = await nextConfig.rewrites?.();

    expect(redirectRules?.find((rule) => rule.source === "/digests")).toBeUndefined();
    expect(redirectRules?.find((rule) => rule.source === "/digest-subscriptions")).toBeUndefined();
    expect(redirectRules?.find((rule) => rule.source === "/governance/risk-exceptions")).toBeUndefined();
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

  it("does not ship redirects for retired /manifests bookmarks", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules?.find((rule) => rule.source === "/manifests")).toBeUndefined();
    expect(redirectRules?.find((rule) => rule.source === "/manifests/:path*")).toBeUndefined();
  });
});
