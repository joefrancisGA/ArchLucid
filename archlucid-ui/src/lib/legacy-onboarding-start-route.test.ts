import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { buildOnboardingRedirectPath } from "@/lib/legacy-onboarding-redirect";
import {
  CANONICAL_ONBOARDING_PATH,
  LEGACY_ONBOARDING_START_PATH,
} from "@/lib/legacy-onboarding-start-route";
import { MARKETING_ROBOTS_DISALLOW_PREFIXES, MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";

const LEGACY_ONBOARDING_START_APP_DIR = join(
  process.cwd(),
  "src",
  "app",
  "(marketing)",
  "onboarding",
  "start",
);

describe("legacy onboarding-start route (ONS / TB-1801 / TB-1805)", () => {
  it("keeps canonical onboarding on first-review-guide", () => {
    expect(LEGACY_ONBOARDING_START_PATH).toBe("/onboarding/start");
    expect(CANONICAL_ONBOARDING_PATH).toBe("/architecture/first-review-guide");
    expect(buildOnboardingRedirectPath({ source: "email" })).toBe(
      "/architecture/first-review-guide?source=email",
    );
  });

  it("does not ship an App Router page under onboarding/start", () => {
    expect(existsSync(join(LEGACY_ONBOARDING_START_APP_DIR, "page.tsx"))).toBe(false);
    expect(existsSync(join(LEGACY_ONBOARDING_START_APP_DIR, "layout.tsx"))).toBe(false);
  });

  it("resolves legacy bookmark readiness via canonical first-review-guide", () => {
    expect(canonicalizeLegacyOperatorRoutePath(LEGACY_ONBOARDING_START_PATH)).toBe(CANONICAL_ONBOARDING_PATH);
  });

  it("does not promote the retired path in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_ONBOARDING_START_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${LEGACY_ONBOARDING_START_PATH}/`);
  });

  it("keeps /onboarding/start in robots disallow prefixes while redirect shim may exist (TB-1802)", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_ONBOARDING_START_PATH);
  });
});
