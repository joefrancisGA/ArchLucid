import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { buildOnboardingRedirectPath } from "@/lib/legacy-onboarding-redirect";
import {
  CANONICAL_ONBOARDING_PATH,
  LEGACY_ONBOARD_PATH,
} from "@/lib/legacy-onboard-route";
import { MARKETING_ROBOTS_DISALLOW_PREFIXES, MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";

const LEGACY_ONBOARD_APP_DIRS = [
  join(process.cwd(), "src", "app", "onboard"),
  join(process.cwd(), "src", "app", "(marketing)", "onboard"),
  join(process.cwd(), "src", "app", "(operator)", "onboard"),
] as const;

describe("legacy onboard route (ON / TB-1796 / TB-1798)", () => {
  it("keeps canonical onboarding on first-review-guide", () => {
    expect(LEGACY_ONBOARD_PATH).toBe("/onboard");
    expect(CANONICAL_ONBOARDING_PATH).toBe("/architecture/first-review-guide");
    expect(buildOnboardingRedirectPath({ source: "email" })).toBe(
      "/architecture/first-review-guide?source=email",
    );
  });

  it("does not ship an App Router page under onboard", () => {
    for (const appDir of LEGACY_ONBOARD_APP_DIRS) {
      expect(existsSync(join(appDir, "page.tsx"))).toBe(false);
      expect(existsSync(join(appDir, "layout.tsx"))).toBe(false);
    }
  });

  it("resolves legacy bookmark readiness via canonical first-review-guide", () => {
    expect(canonicalizeLegacyOperatorRoutePath(LEGACY_ONBOARD_PATH)).toBe(CANONICAL_ONBOARDING_PATH);
  });

  it("does not promote the retired path in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_ONBOARD_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${LEGACY_ONBOARD_PATH}/`);
  });

  it("keeps /onboard in robots disallow prefixes (TB-1800)", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_ONBOARD_PATH);
  });
});
