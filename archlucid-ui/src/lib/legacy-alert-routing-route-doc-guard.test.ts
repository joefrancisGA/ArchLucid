import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ALERT_ROUTING_TAB_PATH } from "@/lib/alert-routing-evidence-copy";
import {
  extractMasterTableRows,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS } from "@/lib/ui-route-traffic-retired-redirect-shims";

const LEGACY_ALERT_ROUTING_PATH_PATTERN = /\/alert-routing(?!-subscriptions)/g;
const LEGACY_PATH_ALLOWED_ON_LINE = /redirect|retired|legacy|unreachable|remove|bookmark|fold|migration|→/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/ui_route_traffic_estimates.template.md",
  "docs/library/OPERATOR_ATLAS.md",
  "docs/quality/MANUAL_QA_CHECKLIST.md",
] as const;

const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledLegacyPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!LEGACY_ALERT_ROUTING_PATH_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("legacy-alert-routing-route-doc-guard (TB-1445)", () => {
  it("documents the canonical Alert rules Notifications tab path", () => {
    expect(ALERT_ROUTING_TAB_PATH).toBe("/governance/alert-rules?tab=notifications");
  });

  it("labels the legacy /alert-routing path redirect-only in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy alert-routing path in ${relativePath}`).toEqual([]);
    }
  });

  it("migrates /alert-routing to the notifications tab in Python WORKBOOK_PATH_MIGRATIONS (TB-1444)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).toContain('"/alert-routing": "/governance/alert-rules?tab=notifications"');
  });

  it("does not track retired AL2 workbook row independently (TB-1443)", () => {
    expect(REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS).toContain("AL2");

    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());

    expect(rows.find((row) => row.id === "AL2")).toBeUndefined();
  });
});
