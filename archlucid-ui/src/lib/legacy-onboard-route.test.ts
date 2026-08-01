import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LEGACY_ONBOARD_ROUTE_METADATA } from "@/lib/legacy-onboard-route-metadata";
import { CANONICAL_ONBOARDING_PATH, LEGACY_ONBOARD_PATH } from "@/lib/legacy-onboard-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";
import { SIGNUP_VERIFY_ONBOARDING_PATH } from "@/lib/signup-verify-navigation";

const ONBOARD_APP_PAGE = join(process.cwd(), "src", "app", "(operator)", "onboard", "page.tsx");
const ONBOARD_APP_LAYOUT = join(process.cwd(), "src", "app", "(operator)", "onboard", "layout.tsx");

const PRODUCT_ONBOARDING_SURFACES = [
  "archlucid-ui/src/lib/signup-verify-navigation.ts",
  "archlucid-ui/src/components/usability/PersistentTrialStatusStrip.tsx",
  "archlucid-ui/src/app/(marketing)/get-started/get-started-content.ts",
  "archlucid-ui/src/lib/pilot-nav-group-builder.ts",
] as const;

describe("legacy-onboard-route (TB-1797 / TB-1799 / TB-1800)", () => {
  it("marks the legacy shim as noindex with honest metadata", () => {
    expect(LEGACY_ONBOARD_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(LEGACY_ONBOARD_ROUTE_METADATA.title).toContain("Redirect");
    expect(LEGACY_ONBOARD_ROUTE_METADATA.description?.toLowerCase()).toContain("legacy");
  });

  it("ships redirect-only App Router page and layout metadata", () => {
    const pageSource = readFileSync(ONBOARD_APP_PAGE, "utf8");
    const layoutSource = readFileSync(ONBOARD_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("permanentRedirect(");
    expect(pageSource).toContain("buildOnboardingRedirectPath");
    expect(layoutSource).toContain("LEGACY_ONBOARD_ROUTE_METADATA");
  });

  it("keeps marketing SEO inventory off /onboard while robots disallow it (TB-1800)", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_ONBOARD_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_ONBOARD_PATH);
  });

  it("keeps product onboarding handoffs on canonical /onboarding (TB-1799)", () => {
    const repoRoot = join(process.cwd(), "..");
    const bannedLegacyHref = `"${LEGACY_ONBOARD_PATH}"`;

    expect(SIGNUP_VERIFY_ONBOARDING_PATH.startsWith(CANONICAL_ONBOARDING_PATH)).toBe(true);

    for (const relativePath of PRODUCT_ONBOARDING_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).not.toContain(bannedLegacyHref);
      expect(source).not.toContain(`href="${LEGACY_ONBOARD_PATH}"`);
      expect(source).toContain(CANONICAL_ONBOARDING_PATH);
    }
  });
});
