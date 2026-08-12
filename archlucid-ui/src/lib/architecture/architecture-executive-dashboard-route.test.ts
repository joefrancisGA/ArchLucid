import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ARCHITECTURE_EXECUTIVE_DASHBOARD_ROUTE_METADATA } from "@/lib/architecture/architecture-executive-dashboard-route-metadata";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import {
  LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH,
  LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH,
  LEGACY_PORTFOLIO_OVERVIEW_PATH,
} from "@/lib/ui-route-traffic-architecture-executive-dashboard";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const EXECUTIVE_DASHBOARD_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "architecture",
  "executive-dashboard",
  "page.tsx",
);
const EXECUTIVE_DASHBOARD_APP_LAYOUT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "architecture",
  "executive-dashboard",
  "layout.tsx",
);

const PRODUCT_EXECUTIVE_DASHBOARD_SURFACES = [
  "archlucid-ui/src/lib/pilot-nav-group-builder.ts",
  "archlucid-ui/src/lib/usability/page-help-topic-map.ts",
  "archlucid-ui/src/lib/nav-disclosure-for-path.ts",
  "archlucid-ui/src/lib/executive/executive-kpi-drill-through-hrefs.ts",
] as const;

const CANONICAL_EXECUTIVE_DASHBOARD_HANDOFF_MARKERS = [
  EXECUTIVE_DASHBOARD_HREF,
  "EXECUTIVE_DASHBOARD_HREF",
  "architecture/executive-dashboard",
] as const;

function expectCanonicalExecutiveDashboardHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_EXECUTIVE_DASHBOARD_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("architecture-executive-dashboard-route (ARE)", () => {
  it("marks the executive dashboard as noindex with honest metadata", () => {
    expect(ARCHITECTURE_EXECUTIVE_DASHBOARD_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(ARCHITECTURE_EXECUTIVE_DASHBOARD_ROUTE_METADATA.title).toBe("Executive dashboard");
    expect(ARCHITECTURE_EXECUTIVE_DASHBOARD_ROUTE_METADATA.description?.toLowerCase()).toContain("governance");
  });

  it("ships the executive ROI dashboard page with layout metadata", () => {
    const pageSource = readFileSync(EXECUTIVE_DASHBOARD_APP_PAGE, "utf8");
    const layoutSource = readFileSync(EXECUTIVE_DASHBOARD_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("ExecutiveRoiDashboardPageView");
    expect(layoutSource).toContain("ARCHITECTURE_EXECUTIVE_DASHBOARD_ROUTE_METADATA");
  });

  it("keeps marketing SEO inventory off the executive dashboard path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(EXECUTIVE_DASHBOARD_HREF);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(EXECUTIVE_DASHBOARD_HREF);
  });

  it("keeps product handoffs on canonical /architecture/executive-dashboard", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_EXECUTIVE_DASHBOARD_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalExecutiveDashboardHandoff(source);
      expect(source).not.toContain(`href="${LEGACY_OPERATOR_EXECUTIVE_DASHBOARD_PATH}"`);
      expect(source).not.toContain(`href="${LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH}"`);
      expect(source).not.toContain(`href="${LEGACY_PORTFOLIO_OVERVIEW_PATH}"`);
    }
  });
});
