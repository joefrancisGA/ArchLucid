import { readFileSync } from "node:fs";

import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FIRST_REVIEW_GUIDE_ROUTE_METADATA } from "@/lib/first-review-guide-route-metadata";

import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";

import { SIGNUP_VERIFY_ONBOARDING_PATH } from "@/lib/signup-verify-navigation";

import {

  MARKETING_ROBOTS_DISALLOW_PREFIXES,

  MARKETING_SITEMAP_PATHNAMES,

} from "@/lib/marketing/public-marketing-seo-paths";

const FIRST_REVIEW_GUIDE_PAGE = join(

  process.cwd(),

  "src",

  "app",

  "(operator)",

  "architecture",

  "first-review-guide",

  "page.tsx",

);

const FIRST_REVIEW_GUIDE_LAYOUT = join(

  process.cwd(),

  "src",

  "app",

  "(operator)",

  "architecture",

  "first-review-guide",

  "layout.tsx",

);

const PRODUCT_FIRST_REVIEW_GUIDE_SURFACES = [

  "archlucid-ui/src/lib/pilot-nav-group-builder.ts",

  "archlucid-ui/src/lib/command-palette-curated-tasks.ts",

  "archlucid-ui/src/lib/signup-verify-navigation.ts",

  "archlucid-ui/src/lib/nav-disclosure-for-path.ts",

  "archlucid-ui/src/lib/help/help-search-panel-catalog.ts",

] as const;

const CANONICAL_FIRST_REVIEW_GUIDE_HANDOFF_MARKERS = [

  FIRST_REVIEW_GUIDE_PATH,

  "FIRST_REVIEW_GUIDE_PATH",

  "architecture/first-review-guide",

] as const;

function expectCanonicalFirstReviewGuideHandoff(source: string): void {

  const hasCanonicalHandoff = CANONICAL_FIRST_REVIEW_GUIDE_HANDOFF_MARKERS.some((marker) =>

    source.includes(marker),

  );

  expect(hasCanonicalHandoff).toBe(true);

}

describe("first-review-guide-route (ARF)", () => {

  it("marks the first-review hub as noindex with honest metadata", () => {

    expect(FIRST_REVIEW_GUIDE_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });

    expect(FIRST_REVIEW_GUIDE_ROUTE_METADATA.title).toBe("First review guide");

    expect(FIRST_REVIEW_GUIDE_ROUTE_METADATA.description?.toLowerCase()).toContain("architecture review");

  });

  it("ships the onboarding hub page with layout metadata", () => {

    const pageSource = readFileSync(FIRST_REVIEW_GUIDE_PAGE, "utf8");

    const layoutSource = readFileSync(FIRST_REVIEW_GUIDE_LAYOUT, "utf8");

    expect(pageSource).toContain("OnboardingPageView");

    expect(pageSource).toContain("source=registration");

    expect(layoutSource).toContain("FIRST_REVIEW_GUIDE_ROUTE_METADATA");

  });

  it("keeps marketing sitemap inventory off the first-review guide path", () => {

    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(FIRST_REVIEW_GUIDE_PATH);

    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(`${FIRST_REVIEW_GUIDE_PATH}/`);

  });

  it("keeps product handoffs on canonical /architecture/first-review-guide", () => {

    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_FIRST_REVIEW_GUIDE_SURFACES) {

      const source = readFileSync(join(repoRoot, relativePath), "utf8");

      expectCanonicalFirstReviewGuideHandoff(source);

    }

    expect(SIGNUP_VERIFY_ONBOARDING_PATH).toBe(`${FIRST_REVIEW_GUIDE_PATH}?source=registration`);

  });

});

