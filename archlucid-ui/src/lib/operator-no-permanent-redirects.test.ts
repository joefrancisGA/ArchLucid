import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

/** Bookmark allowlist — legacy `/reviews` and `/runs` still force-canonical to architecture reviews. */
const ALLOWED_PERMANENT_REDIRECT_SOURCES = new Set([
  "/reviews",
  "/reviews/:path*",
  "/runs",
  "/runs/:path*",
]);

describe("next.config — no permanent bookmark redirects (IA batch 4)", () => {
  it("only allows explicit legacy reviews/runs permanent redirects", async () => {
    const redirectRules = await nextConfig.redirects?.();
    const permanent = (redirectRules ?? []).filter((rule) => rule.permanent === true);
    const unexpected = permanent.filter((rule) => !ALLOWED_PERMANENT_REDIRECT_SOURCES.has(rule.source));

    expect(unexpected).toEqual([]);

    for (const source of ALLOWED_PERMANENT_REDIRECT_SOURCES) {
      expect(permanent.some((rule) => rule.source === source)).toBe(true);
    }
  });
});
