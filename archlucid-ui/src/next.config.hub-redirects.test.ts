import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("next.config hub bookmark redirects", () => {
  it("keeps permanent redirects for advisory and digest legacy shims", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules).toBeDefined();

    expect(
      redirectRules?.find(
        (rule) =>
          rule.source === "/advisory"
          && rule.destination === "/governance/advisory-scans",
      )?.permanent,
    ).toBe(true);

    expect(
      redirectRules?.find(
        (rule) =>
          rule.source === "/advisory-scheduling"
          && rule.destination === "/governance/advisory-scans?tab=schedules",
      )?.permanent,
    ).toBe(true);

    expect(redirectRules?.find((rule) => rule.source === "/settings/exec-digest")).toBeUndefined();
    expect(redirectRules?.find((rule) => rule.source === "/settings/alerts")).toBeUndefined();

    expect(
      redirectRules?.find(
        (rule) =>
          rule.source === "/digest-subscriptions"
          && rule.destination === "/digests?tab=subscriptions",
      )?.permanent,
    ).toBe(true);
  });
});
