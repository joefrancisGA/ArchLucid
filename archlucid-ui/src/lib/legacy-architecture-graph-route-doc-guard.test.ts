import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import {
  CANONICAL_GRAPH_PATH,
  LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH,
} from "@/lib/legacy-architecture-graph-route";
import { RETIRED_REDIRECT_SHIM_TRAFFIC_PATHS } from "@/lib/ui-route-traffic-retired-redirect-shims";
import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

const LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH_PATTERN = /\/operate\/architecture-graph/g;
const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");
const LEGACY_PATH_ALLOWED_ON_LINE =
  /redirect|retired|legacy|deprecated|bookmark|301|noindex|unreachable|removed|canonical|alias|ine|evidence-graph|insights\/evidence-graph/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/information_architecture_assessment_and_backlog.md",
  "docs/architecture/ui_routes.md",
] as const;

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledLegacyOperateArchitectureGraphPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("legacy-architecture-graph-route-doc-guard (TB-1809)", () => {
  it("documents the canonical evidence graph path as the graph hub URL", () => {
    expect(CANONICAL_GRAPH_PATH).toBe(EVIDENCE_GRAPH_PATH);
    expect(CANONICAL_GRAPH_PATH).toBe("/insights/evidence-graph");
    expect(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH).toBe("/operate/architecture-graph");
  });

  it("labels /operate/architecture-graph as retired or redirect-only in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyOperateArchitectureGraphPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy operate architecture-graph path in ${relativePath}`).toEqual([]);
    }
  });

  it("does not score /operate/architecture-graph as a traffic workbook row", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());

    expect(RETIRED_REDIRECT_SHIM_TRAFFIC_PATHS).toContain(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH);
    expect(rows.find((row) => row.path === LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH)).toBeUndefined();
  });

  it("migrates /operate/architecture-graph to evidence-graph in Python WORKBOOK_PATH_MIGRATIONS (TB-1806)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).toContain('"/operate/architecture-graph": "/insights/evidence-graph"');
  });
});
