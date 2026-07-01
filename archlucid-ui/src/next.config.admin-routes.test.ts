import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config administration routes (TB-522)", () => {
  it("redirects legacy /settings/roles index to canonical users tab URL", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules).toBeDefined();

    const rolesRedirect = redirectRules?.find(
      (rule) => rule.source === "/settings/roles" && rule.destination === "/settings/users?tab=roles",
    );

    expect(rolesRedirect?.permanent).toBe(true);
  });

  it("rewrites /settings/users to the tabbed roles page implementation", async () => {
    const rewriteRules = await nextConfig.rewrites?.();

    expect(rewriteRules).toBeDefined();

    const usersRewrite = rewriteRules?.find(
      (rule) => rule.source === "/settings/users" && rule.destination === "/settings/roles",
    );

    expect(usersRewrite).toBeDefined();
  });
});
