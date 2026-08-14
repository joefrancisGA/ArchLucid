import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { buildGraphRedirectPath } from "@/lib/legacy-architecture-graph-redirect";
import {
  CANONICAL_GRAPH_PATH,
  LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH,
} from "@/lib/legacy-architecture-graph-route";
import { MARKETING_ROBOTS_DISALLOW_PREFIXES, MARKETING_SITEMAP_PATHNAMES } from "@/lib/marketing/public-marketing-seo-paths";

const LEGACY_ARCHITECTURE_GRAPH_APP_DIRS = [
  join(process.cwd(), "src", "app", "operate", "architecture-graph"),
  join(process.cwd(), "src", "app", "(operator)", "operate", "architecture-graph"),
  join(process.cwd(), "src", "app", "(marketing)", "operate", "architecture-graph"),
] as const;

const LEGACY_OPERATE_ARCHITECTURE_GRAPH_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "operate",
  "architecture-graph",
  "page.tsx",
);

describe("legacy architecture-graph route (OPR / TB-1806 / TB-1808 / TB-1810)", () => {
  it("keeps canonical graph on evidence-graph with query preserve", () => {
    expect(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH).toBe("/operate/architecture-graph");
    expect(CANONICAL_GRAPH_PATH).toBe("/insights/evidence-graph");
    expect(buildGraphRedirectPath({ runId: "run-42" })).toBe(
      "/insights/evidence-graph?runId=run-42",
    );
  });

  it("does not ship an App Router redirect shim for the legacy operate bookmark", () => {
    expect(existsSync(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PAGE)).toBe(false);
  });

  it("does not ship a graph shell layout or duplicate pages outside the operator shim", () => {
    expect(existsSync(join(process.cwd(), "src", "app", "operate", "architecture-graph", "page.tsx"))).toBe(
      false,
    );
    expect(
      existsSync(join(process.cwd(), "src", "app", "(marketing)", "operate", "architecture-graph", "page.tsx")),
    ).toBe(false);

    for (const appDir of LEGACY_ARCHITECTURE_GRAPH_APP_DIRS) {
      expect(existsSync(join(appDir, "layout.tsx"))).toBe(false);
    }
  });

  it("resolves legacy bookmark readiness via canonical evidence-graph", () => {
    expect(canonicalizeLegacyOperatorRoutePath(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH)).toBe(
      CANONICAL_GRAPH_PATH,
    );
  });

  it("does not promote the retired path in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH}/`);
  });

  it("keeps /operate/architecture-graph in robots disallow prefixes (TB-1807)", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH);
  });
});
