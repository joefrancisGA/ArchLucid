import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LEGACY_ONBOARDING_START_ROUTE_METADATA } from "@/lib/legacy-onboarding-start-route-metadata";
import {
  CANONICAL_ONBOARDING_PATH,
  LEGACY_ONBOARDING_START_PATH,
} from "@/lib/legacy-onboarding-start-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";
import { SIGNUP_VERIFY_ONBOARDING_PATH } from "@/lib/signup-verify-navigation";

const ONBOARDING_START_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "onboarding",
  "start",
  "page.tsx",
);
const ONBOARDING_START_APP_LAYOUT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "onboarding",
  "start",
  "layout.tsx",
);

const BANNED_CLIENT_IMPORT_PATTERNS = [
  '"use client"',
  "FirstReviewGuidePageClient",
  "OnboardingPageView",
  "OnboardingTour",
] as const;

const PRODUCT_ONBOARDING_SURFACES = [
  "archlucid-ui/src/lib/signup-verify-navigation.ts",
  "archlucid-ui/src/components/usability/PersistentTrialStatusStrip.tsx",
  "archlucid-ui/src/app/(marketing)/get-started/get-started-content.ts",
  "archlucid-ui/src/app/(marketing)/signup/verify/SignupVerifyClient.test.tsx",
] as const;

describe("legacy-onboarding-start-route (TB-1802 / TB-1803 / TB-1804 / TB-1805)", () => {
  it("marks the legacy shim as noindex with honest metadata", () => {
    expect(LEGACY_ONBOARDING_START_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(LEGACY_ONBOARDING_START_ROUTE_METADATA.title).toContain("Redirect");
    expect(LEGACY_ONBOARDING_START_ROUTE_METADATA.description?.toLowerCase()).toContain("legacy");
  });

  it("ships redirect-only App Router page and layout metadata (TB-1805)", () => {
    const pageSource = readFileSync(ONBOARDING_START_APP_PAGE, "utf8");
    const layoutSource = readFileSync(ONBOARDING_START_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("permanentRedirect(");
    expect(pageSource).toContain("buildOnboardingRedirectPath");
    expect(layoutSource).toContain("LEGACY_ONBOARDING_START_ROUTE_METADATA");

    for (const bannedPattern of BANNED_CLIENT_IMPORT_PATTERNS) {
      expect(pageSource).not.toContain(bannedPattern);
    }
  });

  it("keeps marketing SEO inventory off /onboarding/start (TB-1804)", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_ONBOARDING_START_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_ONBOARDING_START_PATH);
  });

  it("keeps product onboarding handoffs on canonical /onboarding (TB-1803)", () => {
    const repoRoot = join(process.cwd(), "..");
    const bannedLegacyHref = `"${LEGACY_ONBOARDING_START_PATH}"`;

    expect(SIGNUP_VERIFY_ONBOARDING_PATH.startsWith(CANONICAL_ONBOARDING_PATH)).toBe(true);

    for (const relativePath of PRODUCT_ONBOARDING_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).not.toContain(bannedLegacyHref);
      expect(source).not.toContain(`href="${LEGACY_ONBOARDING_START_PATH}"`);
      expect(source).toContain(CANONICAL_ONBOARDING_PATH);
    }
  });
});
