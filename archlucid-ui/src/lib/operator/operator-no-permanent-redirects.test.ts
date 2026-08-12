import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";

describe("next.config — no permanent bookmark redirects (IA batch 4)", () => {
  it("only allows explicit legacy reviews/runs permanent redirects", async () => {
    const redirectRules = await nextConfig.redirects?.();
    const permanent = (redirectRules ?? []).filter((rule) => rule.permanent === true);

    // Permanent `/reviews` and `/runs` redirects were removed; client canonicalize maps bookmarks.
    expect(permanent).toEqual([]);
  });
});
