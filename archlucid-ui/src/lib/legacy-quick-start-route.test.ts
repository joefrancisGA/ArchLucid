import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LEGACY_QUICK_START_ROUTE_METADATA } from "@/lib/legacy-quick-start-route-metadata";
import {
  CANONICAL_GET_STARTED_PATH,
  LEGACY_QUICK_START_PATH,
} from "@/lib/legacy-quick-start-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const QUICK_START_APP_PAGE = join(process.cwd(), "src", "app", "(marketing)", "quick-start", "page.tsx");
const QUICK_START_APP_LAYOUT = join(process.cwd(), "src", "app", "(marketing)", "quick-start", "layout.tsx");
const QUICK_START_CLIENT = join(process.cwd(), "src", "app", "(marketing)", "quick-start", "QuickStartClient.tsx");

const BANNED_CLIENT_IMPORT_PATTERNS = ['"use client"', "QuickStartClient"] as const;

describe("legacy-quick-start-route (TB-1816 / TB-1817 / TB-1818 / TB-1820)", () => {
  it("marks the legacy shim as noindex with honest metadata", () => {
    expect(LEGACY_QUICK_START_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(LEGACY_QUICK_START_ROUTE_METADATA.title).toContain("Redirect");
    expect(LEGACY_QUICK_START_ROUTE_METADATA.description?.toLowerCase()).toContain("legacy");
    expect(LEGACY_QUICK_START_ROUTE_METADATA.description).toContain(CANONICAL_GET_STARTED_PATH);
  });

  it("ships redirect-only App Router page and layout metadata", () => {
    const pageSource = readFileSync(QUICK_START_APP_PAGE, "utf8");
    const layoutSource = readFileSync(QUICK_START_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("permanentRedirect(");
    expect(pageSource).toContain("buildQuickStartRedirectPath");
    expect(layoutSource).toContain("LEGACY_QUICK_START_ROUTE_METADATA");

    for (const bannedPattern of BANNED_CLIENT_IMPORT_PATTERNS) {
      expect(pageSource).not.toContain(bannedPattern);
    }
  });

  it("retires the orphan QuickStartClient marketing module (TB-1817)", () => {
    expect(() => readFileSync(QUICK_START_CLIENT, "utf8")).toThrow();
  });

  it("keeps marketing SEO inventory off /quick-start while robots disallow it (TB-1818)", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_QUICK_START_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_QUICK_START_PATH);
  });
});
