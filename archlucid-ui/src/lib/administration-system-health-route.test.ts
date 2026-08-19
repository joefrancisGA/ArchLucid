import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ADMINISTRATION_SYSTEM_HEALTH_ROUTE_METADATA } from "@/lib/administration-system-health-route-metadata";
import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import {
  LEGACY_OPERATOR_SYSTEM_HEALTH_PATH,
} from "@/lib/ui-route-traffic-administration-system-health";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const SYSTEM_HEALTH_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "administration",
  "system-health",
  "page.tsx",
);
const SYSTEM_HEALTH_APP_LAYOUT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "administration",
  "system-health",
  "layout.tsx",
);

const PRODUCT_SYSTEM_HEALTH_SURFACES = [
  "archlucid-ui/src/lib/operator/operator-admin-nav-group-builder.ts",
  "archlucid-ui/src/lib/finish-setup-wizard-steps.ts",
  "archlucid-ui/src/lib/first-pilot-command-center-phase.ts",
  "archlucid-ui/src/lib/troubleshooting-help-guide-content.ts",
] as const;

const CANONICAL_SYSTEM_HEALTH_HANDOFF_MARKERS = [
  ADMINISTRATION_SYSTEM_HEALTH_PATH,
  "ADMINISTRATION_SYSTEM_HEALTH_PATH",
  "FINISH_SETUP_SYSTEM_HEALTH_PATH",
] as const;

function expectCanonicalSystemHealthHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_SYSTEM_HEALTH_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("administration-system-health-route (ADY)", () => {
  it("marks the Administration hub as noindex with honest metadata", () => {
    expect(ADMINISTRATION_SYSTEM_HEALTH_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(ADMINISTRATION_SYSTEM_HEALTH_ROUTE_METADATA.title).toBe("System health");
    expect(ADMINISTRATION_SYSTEM_HEALTH_ROUTE_METADATA.description?.toLowerCase()).toContain("dependencies");
  });

  it("ships the system health client page with layout metadata", () => {
    const pageSource = readFileSync(SYSTEM_HEALTH_APP_PAGE, "utf8");
    const layoutSource = readFileSync(SYSTEM_HEALTH_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("SystemHealthPageClient");
    expect(layoutSource).toContain("ADMINISTRATION_SYSTEM_HEALTH_ROUTE_METADATA");
    expect(layoutSource).toContain("OperatorClientDrivenRouteLayout");
  });

  it("keeps marketing SEO inventory off the Administration system-health path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(ADMINISTRATION_SYSTEM_HEALTH_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(ADMINISTRATION_SYSTEM_HEALTH_PATH);
  });

  it("keeps product handoffs on canonical /administration/system-health", () => {
    const repoRoot = join(process.cwd(), "..");
    const bannedLegacyHref = `"${LEGACY_OPERATOR_SYSTEM_HEALTH_PATH}"`;

    for (const relativePath of PRODUCT_SYSTEM_HEALTH_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalSystemHealthHandoff(source);
      expect(source).not.toContain(bannedLegacyHref);
      expect(source).not.toContain(`href="${LEGACY_OPERATOR_SYSTEM_HEALTH_PATH}"`);
    }
  });
});
