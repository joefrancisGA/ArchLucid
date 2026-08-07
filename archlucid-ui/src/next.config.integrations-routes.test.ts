import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config integrations routes (TB-407 / TB-750)", () => {
  it("does not ship permanent bookmark redirects", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules ?? []).toEqual([]);
  });

  it("does not keep pre-release Integration readiness / operations / ITSM hub redirects", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules).toBeDefined();

    expect(
      redirectRules?.some(
        (rule) =>
          rule.source === "/integrations/operations"
          || rule.source === "/integrations/operations/:path*"
          || rule.source === "/integrations/readiness"
          || rule.source === "/integrations/readiness/:path*"
          || rule.source === "/integrations/itsm",
      ),
    ).toBe(false);
  });

  it("does not rewrite canonical integrations URLs to legacy App Router trees (TB-750)", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(rewriteRules).toBeDefined();

    expect(
      rewriteRules?.some(
        (rule) =>
          rule.source === "/integrations/cloud-connections"
          || rule.source === "/integrations/cloud-connections/:path*",
      ),
    ).toBe(false);

    expect(
      rewriteRules?.some(
        (rule) =>
          rule.source === "/administration/connection-status"
          || rule.source === "/administration/connection-status/:path*",
      ),
    ).toBe(false);
  });
});
