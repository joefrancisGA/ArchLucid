import { describe, expect, it } from "vitest";

import {
  MARKETING_CANONICAL_DEMO_PATH,
  MARKETING_CANONICAL_GET_STARTED_PATH,
  MARKETING_LEGACY_DEMO_PREVIEW_PATH,
  MARKETING_LEGACY_LIVE_DEMO_PATH,
  MARKETING_LEGACY_TRY_PATH,
  MARKETING_RETIRED_TRY_IT_ENTRY_PATHS,
} from "@/lib/marketing/marketing-entry-spine";
import { BOOKMARK_PERMANENT_REDIRECTS } from "@/lib/next/bookmark-permanent-redirects";
import { MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";

describe("marketing-entry-spine (TB-2236)", () => {
  it("defines one demo and one get-started spine", () => {
    expect(MARKETING_CANONICAL_DEMO_PATH).toBe("/see-it");
    expect(MARKETING_CANONICAL_GET_STARTED_PATH).toBe("/get-started");
  });

  it("lists retired try-it entry paths for redirect consolidation", () => {
    expect(MARKETING_RETIRED_TRY_IT_ENTRY_PATHS).toEqual([
      MARKETING_LEGACY_TRY_PATH,
      MARKETING_LEGACY_LIVE_DEMO_PATH,
      MARKETING_LEGACY_DEMO_PREVIEW_PATH,
    ]);
  });

  it("redirects retired try-it bookmarks to the canonical demo path", () => {
    for (const legacyPath of MARKETING_RETIRED_TRY_IT_ENTRY_PATHS) {
      const rule = BOOKMARK_PERMANENT_REDIRECTS.find((entry) => entry.source === legacyPath);

      expect(rule?.destination).toBe(MARKETING_CANONICAL_DEMO_PATH);
      expect(rule?.permanent).toBe(true);
    }
  });

  it("keeps retired try-it paths out of the marketing sitemap", () => {
    for (const legacyPath of MARKETING_RETIRED_TRY_IT_ENTRY_PATHS) {
      expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(legacyPath);
    }

    expect(MARKETING_SITEMAP_PATHNAMES).toContain(MARKETING_CANONICAL_DEMO_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).toContain(MARKETING_CANONICAL_GET_STARTED_PATH);
  });
});
