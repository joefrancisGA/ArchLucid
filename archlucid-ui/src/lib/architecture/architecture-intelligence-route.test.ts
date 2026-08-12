import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA } from "@/lib/architecture/architecture-intelligence-route-metadata";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const ARCHITECTURE_INTELLIGENCE_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "architecture",
  "architecture-intelligence",
  "page.tsx",
);
const ARCHITECTURE_INTELLIGENCE_APP_LAYOUT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "architecture",
  "architecture-intelligence",
  "layout.tsx",
);

const PRODUCT_ARCHITECTURE_INTELLIGENCE_SURFACES = [
  "archlucid-ui/src/lib/pilot-nav-group-builder.ts",
  "archlucid-ui/src/lib/architecture/architecture-intelligence-run-href.ts",
  "archlucid-ui/src/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailAiRefinePanel.tsx",
  "archlucid-ui/src/components/governance/findings/governance-findings-queue-operational-actions.tsx",
] as const;

describe("architecture-intelligence-route (AR2)", () => {
  it("marks the reasoning lab as noindex with honest metadata", () => {
    expect(ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA.title).toBe("Architecture intelligence");
    expect(ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA.description?.toLowerCase()).toContain("reasoning");
  });

  it("ships the page shell with client reasoning lab and layout metadata", () => {
    const pageSource = readFileSync(ARCHITECTURE_INTELLIGENCE_APP_PAGE, "utf8");
    const layoutSource = readFileSync(ARCHITECTURE_INTELLIGENCE_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("ArchitectureIntelligencePageClient");
    expect(pageSource).toContain("Suspense");
    expect(layoutSource).toContain("ARCHITECTURE_INTELLIGENCE_ROUTE_METADATA");
  });

  it("keeps marketing SEO inventory off the architecture-intelligence path", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(ARCHITECTURE_INTELLIGENCE_PATH);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain(ARCHITECTURE_INTELLIGENCE_PATH);
  });

  it("keeps product deep links on canonical /architecture/architecture-intelligence", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_ARCHITECTURE_INTELLIGENCE_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");

      expect(
        source.includes(ARCHITECTURE_INTELLIGENCE_PATH) ||
          source.includes("ARCHITECTURE_INTELLIGENCE_PATH") ||
          source.includes("buildArchitectureIntelligenceRunHref"),
      ).toBe(true);
    }

    const runHrefSource = readFileSync(
      join(repoRoot, "archlucid-ui/src/lib/architecture/architecture-intelligence-run-href.ts"),
      "utf8",
    );
    expect(runHrefSource).toContain("buildArchitectureIntelligenceRunHref");
    expect(runHrefSource).toContain("ARCHITECTURE_INTELLIGENCE_PATH");
  });
});
