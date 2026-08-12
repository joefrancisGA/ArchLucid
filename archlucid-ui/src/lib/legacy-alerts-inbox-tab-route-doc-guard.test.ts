import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance-route-paths";
import { RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH } from "@/lib/ui-route-traffic-alerts-inbox-tab";

const LEGACY_ALERTS_INBOX_TAB_PATTERN = /\/governance\/alerts\?tab=inbox/g;
const LEGACY_PATH_ALLOWED_ON_LINE = /redirect|retired|legacy|unreachable|remove|bookmark|fold|migration|→|canonicalize|goi|tb-1594/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/ui_route_traffic_estimates.template.md",
  "docs/library/PRODUCT_PACKAGING.md",
  "docs/library/OPERATOR_ATLAS.md",
] as const;

const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledLegacyPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!LEGACY_ALERTS_INBOX_TAB_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("legacy-alerts-inbox-tab-route-doc-guard (TB-1595)", () => {
  it("documents the canonical alerts inbox path", () => {
    expect(GOVERNANCE_ALERTS_PATH).toBe("/governance/alerts");
    expect(RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH).toBe("/governance/alerts?tab=inbox");
  });

  it("labels the legacy tab=inbox path redirect-only in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy alerts inbox tab path in ${relativePath}`).toEqual([]);
    }
  });

  it("migrates /governance/alerts?tab=inbox to bare inbox in Python WORKBOOK_PATH_MIGRATIONS (TB-1594)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).toContain('"/governance/alerts?tab=inbox": "/governance/alerts"');
  });
});
