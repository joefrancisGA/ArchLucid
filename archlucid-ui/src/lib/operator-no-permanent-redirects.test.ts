import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("next.config — no permanent bookmark redirects (IA batch 4)", () => {
  it("does not ship permanent redirects in next.config", async () => {
    const redirectRules = await nextConfig.redirects?.();

    expect(redirectRules ?? []).toEqual([]);
  });
});
