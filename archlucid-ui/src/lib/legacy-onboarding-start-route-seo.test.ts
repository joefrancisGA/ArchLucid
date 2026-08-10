import { describe, expect, it } from "vitest";

import { LEGACY_ONBOARDING_START_PATH } from "@/lib/legacy-onboarding-start-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

describe("legacy-onboarding-start-route SEO inventory (TB-1804)", () => {
  it("does not promote /onboarding/start in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_ONBOARDING_START_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${LEGACY_ONBOARDING_START_PATH}/`);
  });

  it("keeps /onboarding/start in robots disallow prefixes while the redirect shim may exist", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_ONBOARDING_START_PATH);
  });
});
