import { describe, expect, it } from "vitest";

import {
  MARKETING_CANONICAL_DEMO_PATH,
  MARKETING_CANONICAL_GET_STARTED_PATH,
} from "@/lib/marketing/marketing-entry-spine";
import { MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";
import { BOOKMARK_PERMANENT_REDIRECTS } from "@/lib/next/bookmark-permanent-redirects";

describe("marketing-entry-spine (TB-2236)", () => {
  it("defines one demo and one get-started spine", () => {
    expect(MARKETING_CANONICAL_DEMO_PATH).toBe("/see-it");
    expect(MARKETING_CANONICAL_GET_STARTED_PATH).toBe("/get-started");
  });

  it("keeps retired try-it paths out of the marketing sitemap", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain("/try");
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain("/live-demo");
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain("/demo/preview");
    expect(MARKETING_SITEMAP_PATHNAMES).toContain(MARKETING_CANONICAL_DEMO_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).toContain(MARKETING_CANONICAL_GET_STARTED_PATH);
  });

  it("lets retired try-it routes 404 instead of costing visitors a redirect hop", () => {
    const sources = BOOKMARK_PERMANENT_REDIRECTS.map((rule) => rule.source);

    expect(sources).not.toContain("/try");
    expect(sources).not.toContain("/live-demo");
    expect(sources).not.toContain("/demo/preview");
  });
});
