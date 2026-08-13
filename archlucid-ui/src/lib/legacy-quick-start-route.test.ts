import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { buildQuickStartRedirectPath } from "@/lib/legacy-quick-start-redirect";
import {
  CANONICAL_GET_STARTED_PATH,
  LEGACY_QUICK_START_PATH,
} from "@/lib/legacy-quick-start-route";
import { MARKETING_ROBOTS_DISALLOW_PREFIXES, MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";

const LEGACY_QUICK_START_APP_DIR = join(process.cwd(), "src", "app", "(marketing)", "quick-start");

describe("legacy quick-start route (QUI / TB-1816 / TB-1820)", () => {
  it("keeps canonical marketing entry on /get-started", () => {
    expect(LEGACY_QUICK_START_PATH).toBe("/quick-start");
    expect(CANONICAL_GET_STARTED_PATH).toBe("/get-started");
    expect(buildQuickStartRedirectPath({ source: "email" })).toBe("/get-started?source=email");
  });

  it("does not ship an App Router page under quick-start", () => {
    expect(existsSync(join(LEGACY_QUICK_START_APP_DIR, "page.tsx"))).toBe(false);
    expect(existsSync(join(LEGACY_QUICK_START_APP_DIR, "layout.tsx"))).toBe(false);
  });

  it("resolves legacy bookmark readiness via canonical get-started", () => {
    expect(canonicalizeLegacyOperatorRoutePath(LEGACY_QUICK_START_PATH)).toBe(CANONICAL_GET_STARTED_PATH);
  });

  it("does not promote the retired path in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_QUICK_START_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${LEGACY_QUICK_START_PATH}/`);
  });

  it("keeps /quick-start in robots disallow prefixes while redirect shim may exist (TB-1818)", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_QUICK_START_PATH);
  });
});
