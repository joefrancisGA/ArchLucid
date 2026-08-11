import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CANONICAL_GET_STARTED_PATH,
  LEGACY_QUICK_START_PATH,
} from "@/lib/legacy-quick-start-route";
import { LEGACY_QUICK_START_TRAFFIC_NOTE } from "@/lib/ui-route-traffic-legacy-quick-start";

const LEGACY_QUICK_START_PATH_PATTERN = /\/quick-start/g;
const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");
const LEGACY_PATH_ALLOWED_ON_LINE =
  /redirect|retired|legacy|deprecated|bookmark|301|noindex|unreachable|removed|canonical/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/information_architecture_assessment_and_backlog.md",
  "docs/architecture/customer_facing_cloud_neutrality_assessment.md",
  "docs/architecture/showcase_scenario_strategy_assessment_2026_07_23.md",
  "docs/architecture/ui_routes.md",
  "docs/architecture/ui_route_traffic_estimates.template.md",
] as const;

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledLegacyQuickStartPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!LEGACY_QUICK_START_PATH_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("legacy-quick-start-route-doc-guard (TB-1819)", () => {
  it("documents the canonical get-started path as the buyer URL", () => {
    expect(CANONICAL_GET_STARTED_PATH).toBe("/get-started");
    expect(LEGACY_QUICK_START_PATH).toBe("/quick-start");
  });

  it("labels /quick-start as retired or redirect-only in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyQuickStartPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy quick-start path in ${relativePath}`).toEqual([]);
    }
  });

  it("does not present the legacy quick-start path as a live marketing surface in traffic notes", () => {
    expect(LEGACY_QUICK_START_TRAFFIC_NOTE.toLowerCase()).toContain("legacy");
    expect(LEGACY_QUICK_START_TRAFFIC_NOTE.toLowerCase()).toContain("/get-started");
    expect(LEGACY_QUICK_START_TRAFFIC_NOTE).not.toMatch(/live marketing/i);
  });

  it("migrates /quick-start to get-started in Python WORKBOOK_PATH_MIGRATIONS (TB-1816)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).toContain('"/quick-start": "/get-started"');
  });
});
