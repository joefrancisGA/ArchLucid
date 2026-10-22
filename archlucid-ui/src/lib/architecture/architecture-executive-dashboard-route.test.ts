import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ARCHITECTURE_SPONSOR_DASHBOARD_ROUTE_METADATA } from "@/lib/architecture/architecture-sponsor-dashboard-route-metadata";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  LEGACY_SPONSOR_SHELL_DASHBOARD_PATH,
  LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH,
  LEGACY_PORTFOLIO_OVERVIEW_PATH,
} from "@/lib/ui-route-traffic-architecture-sponsor-dashboard";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const SPONSOR_DASHBOARD_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "architecture",
  "sponsor-dashboard",
  "page.tsx",
);
const SPONSOR_DASHBOARD_APP_LAYOUT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "architecture",
  "sponsor-dashboard",
  "layout.tsx",
);

const PRODUCT_SPONSOR_DASHBOARD_SURFACES = [
  "archlucid-ui/src/lib/pilot-nav-group-builder.ts",
  "archlucid-ui/src/lib/usability/page-help-topic-rows.ts",
  "archlucid-ui/src/lib/nav-disclosure-for-path.ts",
  "archlucid-ui/src/lib/sponsor/sponsor-kpi-drill-through-hrefs.ts",
] as const;

const CANONICAL_SPONSOR_DASHBOARD_HANDOFF_MARKERS = [
  SPONSOR_DASHBOARD_HREF,
  "SPONSOR_DASHBOARD_HREF",
  "architecture/sponsor-dashboard",
] as const;

function expectCanonicalSponsorDashboardHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_SPONSOR_DASHBOARD_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("architecture-sponsor-dashboard-route (ARE)", () => {
  it("marks the sponsor dashboard as noindex with honest metadata", () => {
    expect(ARCHITECTURE_SPONSOR_DASHBOARD_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(ARCHITECTURE_SPONSOR_DASHBOARD_ROUTE_METADATA.title).toBe("Sponsor dashboard");
    expect(ARCHITECTURE_SPONSOR_DASHBOARD_ROUTE_METADATA.description?.toLowerCase()).toContain("governance");
  });

  it("ships the sponsor ROI dashboard page with layout metadata", () => {
    const pageSource = readFileSync(SPONSOR_DASHBOARD_APP_PAGE, "utf8");
    const layoutSource = readFileSync(SPONSOR_DASHBOARD_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("SponsorRoiDashboardPageView");
    expect(layoutSource).toContain("ARCHITECTURE_SPONSOR_DASHBOARD_ROUTE_METADATA");
  });

  it("keeps marketing SEO inventory off the sponsor dashboard path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(SPONSOR_DASHBOARD_HREF);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(SPONSOR_DASHBOARD_HREF);
  });

  it("keeps product handoffs on canonical /architecture/sponsor-dashboard", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_SPONSOR_DASHBOARD_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalSponsorDashboardHandoff(source);
      expect(source).not.toContain(`href="${LEGACY_OPERATOR_SPONSOR_DASHBOARD_PATH}"`);
      expect(source).not.toContain(`href="${LEGACY_SPONSOR_SHELL_DASHBOARD_PATH}"`);
      expect(source).not.toContain(`href="${LEGACY_PORTFOLIO_OVERVIEW_PATH}"`);
    }
  });
});
