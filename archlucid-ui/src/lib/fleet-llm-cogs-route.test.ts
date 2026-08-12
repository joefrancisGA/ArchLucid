import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FLEET_LLM_COGS_ROUTE_METADATA } from "@/lib/fleet-llm-cogs-route-metadata";
import { FLEET_LLM_COGS_PATH } from "@/lib/fleet-llm-cogs-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const FLEET_LLM_COGS_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "internal",
  "fleet-llm-cogs",
  "page.tsx",
);
const FLEET_LLM_COGS_LAYOUT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "internal",
  "fleet-llm-cogs",
  "layout.tsx",
);

const PRODUCT_FLEET_LLM_COGS_SURFACES = [
  "archlucid-ui/src/lib/operator-system-admin-nav-group-builder.ts",
  "archlucid-ui/src/lib/trial-funnel-ops.ts",
] as const;

const CANONICAL_FLEET_LLM_COGS_HANDOFF_MARKERS = [
  FLEET_LLM_COGS_PATH,
  "FLEET_LLM_COGS_PATH",
  "INTERNAL_FLEET_LLM_COGS_PATH",
  "fetchAdminFleetLlmCogsDashboard",
  "internal/fleet-llm-cogs",
  "fleet-llm-cogs",
] as const;

function expectCanonicalFleetLlmCogsHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_FLEET_LLM_COGS_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("fleet-llm-cogs-route (AFX)", () => {
  it("marks the fleet LLM COGS dashboard as noindex with honest metadata", () => {
    expect(FLEET_LLM_COGS_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(FLEET_LLM_COGS_ROUTE_METADATA.title).toBe("Fleet LLM COGS");
    expect(FLEET_LLM_COGS_ROUTE_METADATA.description?.toLowerCase()).toContain("cogs");
  });

  it("ships the admin dashboard page with layout metadata", () => {
    const pageSource = readFileSync(FLEET_LLM_COGS_PAGE, "utf8");
    const layoutSource = readFileSync(FLEET_LLM_COGS_LAYOUT, "utf8");

    expect(pageSource).toContain("FleetLlmCogsAdminPageClient");
    expect(layoutSource).toContain("FLEET_LLM_COGS_ROUTE_METADATA");
    expect(layoutSource).toContain("OperatorClientDrivenRouteLayout");
  });

  it("keeps marketing sitemap inventory off the fleet LLM COGS path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(FLEET_LLM_COGS_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain("/internal/");
    expect(FLEET_LLM_COGS_PATH.startsWith("/internal/")).toBe(true);
  });

  it("keeps product handoffs on canonical /internal/fleet-llm-cogs", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_FLEET_LLM_COGS_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalFleetLlmCogsHandoff(source);
    }
  });
});
