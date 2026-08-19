import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA } from "@/lib/administration-connection-status-route-metadata";
import { ADMINISTRATION_CONNECTION_STATUS_PATH } from "@/lib/integrations-nav-paths";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const CONNECTION_STATUS_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "administration",
  "connection-status",
  "page.tsx",
);
const CONNECTION_STATUS_APP_LAYOUT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "administration",
  "connection-status",
  "layout.tsx",
);

const PRODUCT_CONNECTION_STATUS_SURFACES = [
  "archlucid-ui/src/lib/operator/operator-admin-nav-group-builder.ts",
  "archlucid-ui/src/lib/help/help-search-panel-catalog.ts",
  "archlucid-ui/src/app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationPageHeader.test.tsx",
] as const;

const REMOVED_READINESS_PATH = "/integrations/readiness";

describe("administration-connection-status-route (ADC)", () => {
  it("marks the Administration hub as noindex with honest metadata", () => {
    expect(ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA.title).toBe("Connection status");
    expect(ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA.description?.toLowerCase()).toContain("integrations");
  });

  it("ships the connector dashboard page with layout metadata", () => {
    const pageSource = readFileSync(CONNECTION_STATUS_APP_PAGE, "utf8");
    const layoutSource = readFileSync(CONNECTION_STATUS_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("ConnectorOperationsDashboard");
    expect(pageSource).toContain("PageContextualHelpButton");
    expect(pageSource).not.toContain('"use client"');
    expect(layoutSource).toContain("ADMINISTRATION_CONNECTION_STATUS_ROUTE_METADATA");
  });

  it("keeps marketing SEO inventory off the Administration connection-status path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(ADMINISTRATION_CONNECTION_STATUS_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(ADMINISTRATION_CONNECTION_STATUS_PATH);
  });

  it("keeps product handoffs on canonical /administration/connection-status", () => {
    const repoRoot = join(process.cwd(), "..");
    const bannedLegacyHref = `"${REMOVED_READINESS_PATH}"`;

    for (const relativePath of PRODUCT_CONNECTION_STATUS_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).toContain(ADMINISTRATION_CONNECTION_STATUS_PATH);
      expect(source).not.toContain(bannedLegacyHref);
      expect(source).not.toContain(`href="${REMOVED_READINESS_PATH}"`);
    }
  });
});
