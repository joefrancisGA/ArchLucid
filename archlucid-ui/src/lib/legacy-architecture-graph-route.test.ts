import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { buildGraphRedirectPath } from "@/lib/legacy-architecture-graph-redirect";
import {
  CANONICAL_GRAPH_PATH,
  LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH,
} from "@/lib/legacy-architecture-graph-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";
import { RETIRED_OPERATE_ARCHITECTURE_GRAPH_BOOKMARK_PATH } from "@/lib/ui-route-traffic-retired-redirect-shims";

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

const GRAPH_SHELL_PATTERNS = [/ArchitectureGraphViewer/, /ReactFlow/, /"use client"/] as const;

describe("legacy architecture-graph route (OPR / TB-1806 / TB-1808 / TB-1810)", () => {
  it("keeps canonical graph on evidence-graph with query preserve", () => {
    expect(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH).toBe("/operate/architecture-graph");
    expect(RETIRED_OPERATE_ARCHITECTURE_GRAPH_BOOKMARK_PATH).toBe(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH);
    expect(CANONICAL_GRAPH_PATH).toBe("/insights/evidence-graph");
    expect(buildGraphRedirectPath({ runId: "run-42" })).toBe(
      "/insights/evidence-graph?runId=run-42",
    );
  });

  it("does not ship an App Router page or graph shell under operate/architecture-graph (TB-1810)", () => {
    expect(existsSync(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PAGE)).toBe(false);

    for (const appDir of LEGACY_ARCHITECTURE_GRAPH_APP_DIRS) {
      const pagePath = join(appDir, "page.tsx");
      const layoutPath = join(appDir, "layout.tsx");

      expect(existsSync(pagePath)).toBe(false);
      expect(existsSync(layoutPath)).toBe(false);

      if (!existsSync(appDir)) {
        continue;
      }

      for (const entry of readdirSync(appDir)) {
        if (!/\.(tsx|ts|jsx|js)$/.test(entry)) {
          continue;
        }

        const source = readFileSync(join(appDir, entry), "utf8");

        for (const pattern of GRAPH_SHELL_PATTERNS) {
          expect(source, `unexpected graph UI in ${join(appDir, entry)}`).not.toMatch(pattern);
        }
      }
    }
  });

  it("does not canonicalize retired operate/architecture-graph bookmark (LOG / OXX / OAX class)", () => {
    expect(canonicalizeLegacyOperatorRoutePath(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH)).toBe(
      LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH,
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
