import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  hrefTargetsPermanentRedirectSource,
  NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS,
} from "@/lib/next-config-permanent-redirect-source-paths";
import { LEGACY_SPONSOR_SHELL_DASHBOARD_PATH } from "@/lib/ui-route-traffic-architecture-sponsor-dashboard";

import nextConfig from "../../next.config";

const LEGACY_SPONSOR_DASHBOARD_APP_DIR = join(
  process.cwd(),
  "src",
  "app",
  "(sponsor)",
  "sponsor",
  "dashboard",
);

const PORTFOLIO_VIEW_MARKERS = [
  "SponsorRoiDashboardPageView",
  "ExecutiveRoiDashboardPageView",
] as const;

function legacySponsorDashboardPageSource(): string | null {
  const pagePath = join(LEGACY_SPONSOR_DASHBOARD_APP_DIR, "page.tsx");

  if (!existsSync(pagePath)) {
    return null;
  }

  return readFileSync(pagePath, "utf8");
}

function shipsPortfolioViewAtLegacySponsorDashboard(): boolean {
  const pageSource = legacySponsorDashboardPageSource();

  if (pageSource === null) {
    return false;
  }

  return PORTFOLIO_VIEW_MARKERS.some((marker) => pageSource.includes(marker));
}

async function hasPermanentNextConfigRedirect(path: string): Promise<boolean> {
  const redirectRules = await nextConfig.redirects?.();
  const matchingRule = redirectRules?.find(
    (entry) => entry.source === path || entry.source === `${path}/:path*`,
  );

  if (matchingRule === undefined) {
    return false;
  }

  return matchingRule.permanent === true;
}

describe("sponsor-dashboard dual-SoT guard (TB-1528 / TB-608)", () => {
  it("forbids /sponsor/dashboard permanent redirect coexisting with portfolio App Router page", async () => {
    const hasRedirect = await hasPermanentNextConfigRedirect(LEGACY_SPONSOR_SHELL_DASHBOARD_PATH);
    const hasPortfolioPage = shipsPortfolioViewAtLegacySponsorDashboard();

    if (hasRedirect && hasPortfolioPage) {
      expect.fail(
        "Dual-SoT regression: next.config permanent redirect and App Router portfolio page both exist for /sponsor/dashboard. Resolve via TB-1525 / TB-608.",
      );
    }

    expect(hasRedirect && hasPortfolioPage).toBe(false);
  });

  it("keeps redirect inventory aligned with next.config for /sponsor/dashboard", async () => {
    const hasRedirect = await hasPermanentNextConfigRedirect(LEGACY_SPONSOR_SHELL_DASHBOARD_PATH);
    const listedInRedirectInventory = NEXT_CONFIG_PERMANENT_REDIRECT_SOURCE_PATHS.includes(
      LEGACY_SPONSOR_SHELL_DASHBOARD_PATH,
    );

    expect(listedInRedirectInventory).toBe(hasRedirect);
    expect(hrefTargetsPermanentRedirectSource(LEGACY_SPONSOR_SHELL_DASHBOARD_PATH)).toBe(hasRedirect);
  });

  it("treats legacy /sponsor/dashboard portfolio page as SoT only when no permanent redirect exists", async () => {
    const hasRedirect = await hasPermanentNextConfigRedirect(LEGACY_SPONSOR_SHELL_DASHBOARD_PATH);
    const hasPortfolioPage = shipsPortfolioViewAtLegacySponsorDashboard();

    if (hasPortfolioPage) {
      expect(
        hasRedirect,
        "When /sponsor/dashboard ships portfolio UI, next.config must not also permanently redirect that path (TB-1525).",
      ).toBe(false);
    }
  });
});
