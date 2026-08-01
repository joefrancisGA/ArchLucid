import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA } from "@/lib/legacy-architecture-graph-route-metadata";
import {
  CANONICAL_GRAPH_PATH,
  LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH,
} from "@/lib/legacy-architecture-graph-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const ARCHITECTURE_GRAPH_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "operate",
  "architecture-graph",
  "page.tsx",
);
const ARCHITECTURE_GRAPH_APP_LAYOUT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "operate",
  "architecture-graph",
  "layout.tsx",
);

const BANNED_CLIENT_IMPORT_PATTERNS = [
  '"use client"',
  "ArchitectureGraphViewer",
  "GraphPageContent",
  "GraphLoadedExperience",
] as const;

const PRODUCT_GRAPH_SURFACES = [
  "archlucid-ui/src/components/CorePilotNextStepsCard.tsx",
  "archlucid-ui/src/components/OperatorFirstRunWorkflowPanel.tsx",
  "archlucid-ui/src/app/(operator)/reviews/[runId]/provenance/page.tsx",
  "archlucid-ui/src/app/(operator)/graph/_sections/GraphSampleModeBanner.tsx",
] as const;

describe("legacy-architecture-graph-route (TB-1807 / TB-1809 / TB-1810)", () => {
  it("marks the legacy shim as noindex with honest metadata", () => {
    expect(LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA.title).toContain("Redirect");
    expect(LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA.description?.toLowerCase()).toContain("legacy");
  });

  it("ships redirect-only App Router page and layout metadata (TB-1810)", () => {
    const pageSource = readFileSync(ARCHITECTURE_GRAPH_APP_PAGE, "utf8");
    const layoutSource = readFileSync(ARCHITECTURE_GRAPH_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("redirect(");
    expect(pageSource).toContain("buildGraphRedirectPath");
    expect(layoutSource).toContain("LEGACY_ARCHITECTURE_GRAPH_ROUTE_METADATA");

    for (const bannedPattern of BANNED_CLIENT_IMPORT_PATTERNS) {
      expect(pageSource).not.toContain(bannedPattern);
    }
  });

  it("keeps marketing SEO inventory off the legacy Operate graph path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH);
  });

  it("keeps product graph handoffs on canonical /graph (TB-1809)", () => {
    const repoRoot = join(process.cwd(), "..");
    const bannedLegacyHref = `"${LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH}"`;

    for (const relativePath of PRODUCT_GRAPH_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).not.toContain(bannedLegacyHref);
      expect(source).not.toContain(`href="${LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH}"`);
      expect(source).toContain(CANONICAL_GRAPH_PATH);
    }
  });
});
