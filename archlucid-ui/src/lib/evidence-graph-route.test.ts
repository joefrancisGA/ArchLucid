import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EVIDENCE_GRAPH_ROUTE_METADATA } from "@/lib/evidence-graph-route-metadata";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const EVIDENCE_GRAPH_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "insights",
  "evidence-graph",
  "page.tsx",
);
const EVIDENCE_GRAPH_LAYOUT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "insights",
  "evidence-graph",
  "layout.tsx",
);

const PRODUCT_EVIDENCE_GRAPH_SURFACES = [
  "archlucid-ui/src/lib/operate-analysis-nav-group-builder.ts",
  "archlucid-ui/src/lib/command-palette-curated-tasks.ts",
  "archlucid-ui/src/lib/nav-committed-architecture-review-promotion.ts",
  "archlucid-ui/src/lib/graph-finding-deep-links.ts",
  "archlucid-ui/src/lib/empty-state-presets.ts",
] as const;

const CANONICAL_EVIDENCE_GRAPH_HANDOFF_MARKERS = [
  EVIDENCE_GRAPH_PATH,
  "EVIDENCE_GRAPH_PATH",
  "evidenceGraphHref",
  "insights/evidence-graph",
] as const;

function expectCanonicalEvidenceGraphHandoff(source: string): void {
  const hasCanonicalHandoff = CANONICAL_EVIDENCE_GRAPH_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasCanonicalHandoff).toBe(true);
}

describe("evidence-graph-route (GRA)", () => {
  it("marks the evidence graph hub as noindex with honest metadata", () => {
    expect(EVIDENCE_GRAPH_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(EVIDENCE_GRAPH_ROUTE_METADATA.title).toBe("Evidence graph");
    expect(EVIDENCE_GRAPH_ROUTE_METADATA.description?.toLowerCase()).toContain("evidence");
  });

  it("ships the graph page shell with layout metadata", () => {
    const pageSource = readFileSync(EVIDENCE_GRAPH_PAGE, "utf8");
    const layoutSource = readFileSync(EVIDENCE_GRAPH_LAYOUT, "utf8");

    expect(pageSource).toContain("GraphPageContent");
    expect(pageSource).toContain("Suspense");
    expect(layoutSource).toContain("EVIDENCE_GRAPH_ROUTE_METADATA");
  });

  it("keeps marketing sitemap inventory off the evidence graph path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(EVIDENCE_GRAPH_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(EVIDENCE_GRAPH_PATH);
  });

  it("keeps product handoffs on canonical /insights/evidence-graph", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_EVIDENCE_GRAPH_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expectCanonicalEvidenceGraphHandoff(source);
    }

    expect(evidenceGraphHref({ runId: "run-42" })).toBe(`${EVIDENCE_GRAPH_PATH}?runId=run-42`);
  });
});
