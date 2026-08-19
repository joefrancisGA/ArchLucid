import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { buildQuickStartRedirectPath } from "@/lib/legacy-quick-start-redirect";
import {
  CANONICAL_GET_STARTED_PATH,
  LEGACY_QUICK_START_PATH,
} from "@/lib/legacy-quick-start-route";
import { MARKETING_ROBOTS_DISALLOW_PREFIXES, MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";
import {
  REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS,
  RETIRED_REDIRECT_SHIM_TRAFFIC_PATHS,
} from "@/lib/ui-route-traffic-retired-redirect-shims";

const LEGACY_QUICK_START_APP_DIR = join(process.cwd(), "src", "app", "(marketing)", "quick-start");
const LEGACY_QUICK_START_CLIENT = join(LEGACY_QUICK_START_APP_DIR, "QuickStartClient.tsx");
const LEGACY_QUICK_START_PAGE = join(LEGACY_QUICK_START_APP_DIR, "page.tsx");

const QUICK_START_MARKETING_FUNNEL_PATTERNS = [
  /QuickStartClient/,
  /no-sign-in simulator/i,
  /Quick start funnel/i,
] as const;

function collectRouteModuleSources(rootDir: string): string[] {
  if (!existsSync(rootDir)) {
    return [];
  }

  const sources: string[] = [];

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      sources.push(...collectRouteModuleSources(entryPath));
      continue;
    }

    if (entry.isFile() && /\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      sources.push(readFileSync(entryPath, "utf8"));
    }
  }

  return sources;
}

describe("legacy quick-start route (QUI / TB-1816 / TB-1817 / TB-1820)", () => {
  it("keeps canonical marketing entry on /get-started", () => {
    expect(LEGACY_QUICK_START_PATH).toBe("/quick-start");
    expect(CANONICAL_GET_STARTED_PATH).toBe("/get-started");
    expect(buildQuickStartRedirectPath({ source: "email" })).toBe("/get-started?source=email");
  });

  it("does not ship an App Router page under quick-start (TB-1817 / TB-1820)", () => {
    expect(existsSync(LEGACY_QUICK_START_PAGE)).toBe(false);
    expect(existsSync(join(LEGACY_QUICK_START_APP_DIR, "layout.tsx"))).toBe(false);
    expect(existsSync(LEGACY_QUICK_START_CLIENT)).toBe(false);
  });

  it("does not mount competing marketing quick-start UI under the retired route module", () => {
    for (const source of collectRouteModuleSources(LEGACY_QUICK_START_APP_DIR)) {
      for (const pattern of QUICK_START_MARKETING_FUNNEL_PATTERNS) {
        expect(source, "unexpected quick-start marketing UI under retired route").not.toMatch(pattern);
      }
    }
  });

  it("tracks /quick-start as a retired redirect shim bookmark only (TB-1816 / TB-1820)", () => {
    expect(REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS).toContain("QUI");
    expect(RETIRED_REDIRECT_SHIM_TRAFFIC_PATHS).toContain(LEGACY_QUICK_START_PATH);
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
