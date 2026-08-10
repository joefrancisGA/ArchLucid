import { describe, expect, it } from "vitest";

import { LEGACY_ONBOARD_PATH } from "@/lib/legacy-onboard-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

describe("legacy-onboard-route SEO inventory (TB-1800)", () => {
  it("does not promote /onboard in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_ONBOARD_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${LEGACY_ONBOARD_PATH}/`);
  });

  it("keeps /onboard in robots disallow prefixes while the redirect shim may exist", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_ONBOARD_PATH);
  });
});
