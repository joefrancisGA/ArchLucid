import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
  LEGACY_CORE_PILOT_HELP_PATH,
} from "@/lib/first-architecture-review-help-route";
import {
  CORE_PILOT_HELP_ALIAS_CANONICAL_PATH,
  CORE_PILOT_HELP_ALIAS_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-core-pilot-help-alias";
import {
  HELP_TOPIC_SLUG_ALIASES,
  normalizeHelpTopicSlug,
} from "@/lib/product-documentation-registry";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const HELP_TOPIC_PAGE = join(process.cwd(), "src", "app", "(operator)", "help", "[...topic]", "page.tsx");
const ROUTE_CATALOG = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");

const CORE_PILOT_ALIAS_SURFACES = [
  "archlucid-ui/src/lib/help-search-panel-catalog.ts",
] as const;

describe("core-pilot-help-alias-route (ECO)", () => {
  it("tracks the legacy bookmark path separately from the canonical HCO path", () => {
    expect(CORE_PILOT_HELP_ALIAS_TRAFFIC_PATH).toBe(LEGACY_CORE_PILOT_HELP_PATH);
    expect(CORE_PILOT_HELP_ALIAS_CANONICAL_PATH).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_PATH);
    expect(CORE_PILOT_HELP_ALIAS_TRAFFIC_PATH).not.toBe(CORE_PILOT_HELP_ALIAS_CANONICAL_PATH);
  });

  it("resolves the core-pilot slug alias to first-architecture-review", () => {
    expect(HELP_TOPIC_SLUG_ALIASES["core-pilot"]).toBe("first-architecture-review");
    expect(normalizeHelpTopicSlug("core-pilot")).toBe("first-architecture-review");
  });

  it("registers the alias slug for static help params and specialty rendering", () => {
    const pageSource = readFileSync(HELP_TOPIC_PAGE, "utf8");
    const catalogSource = readFileSync(ROUTE_CATALOG, "utf8");

    expect(pageSource).toContain("HELP_TOPIC_SLUG_ALIASES");
    expect(pageSource).toContain('loaded.entry.slug === "first-architecture-review"');
    expect(catalogSource).toContain('"/help/core-pilot": "/help/first-architecture-review"');
  });

  it("keeps marketing SEO inventory off the legacy alias path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_CORE_PILOT_HELP_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(LEGACY_CORE_PILOT_HELP_PATH);
  });

  it("keeps help-search recommendations wired for legacy /help/core-pilot bookmarks", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of CORE_PILOT_ALIAS_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).toContain("/help/core-pilot");
      expect(source).toContain("/help/first-architecture-review");
    }
  });
});
