import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config integrations routes (TB-407 / TB-750)", () => {
  it("keeps permanent redirects for legacy integrations URLs", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules).toBeDefined();

    expect(
      redirectRules?.find(
        (rule) =>
          rule.source === "/settings/cloud-connections"
          && rule.destination === "/integrations/cloud-connections",
      )?.permanent,
    ).toBe(true);

    expect(
      redirectRules?.find(
        (rule) =>
          rule.source === "/integrations/operations"
          && rule.destination === "/administration/connection-status",
      )?.permanent,
    ).toBe(true);

    expect(
      redirectRules?.find(
        (rule) =>
          rule.source === "/integrations/readiness"
          && rule.destination === "/administration/connection-status",
      )?.permanent,
    ).toBe(true);
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
