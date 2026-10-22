import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  AI_USAGE_LEGACY_ADMIN_PATH,
  AI_USAGE_SETTINGS_PATH,
} from "@/lib/ai-usage-nav-paths";
import { AI_USAGE_SETTINGS_TRAFFIC_NOTE } from "@/lib/ui-route-traffic-ai-usage-settings";

const LEGACY_AI_USAGE_PATH_PATTERN = /\/admin\/ai-usage-cost/g;
const LEGACY_PATH_ALLOWED_ON_LINE = /redirect|retired|legacy|unreachable|remove|bookmark|fold|migration|→|traffic|adi|tb-1406/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/information_architecture_assessment_and_backlog.md",
  "docs/architecture/ui_route_traffic_estimates.template.md",
] as const;

const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledLegacyPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!LEGACY_AI_USAGE_PATH_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("ai-usage-legacy-route-doc-guard (TB-1408)", () => {
  it("documents the canonical AI usage settings path", () => {
    expect(AI_USAGE_SETTINGS_PATH).toBe("/administration/ai-usage");
    expect(AI_USAGE_LEGACY_ADMIN_PATH).toBe("/admin/ai-usage-cost");
  });

  it("labels the legacy admin path redirect-only in contributor docs and traffic template", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy AI usage path in ${relativePath}`).toEqual([]);
    }
  });

  it("does not present the legacy admin path as a live sibling route in ADI traffic notes", () => {
    expect(AI_USAGE_SETTINGS_TRAFFIC_NOTE.toLowerCase()).toContain("redirect-only");
    expect(AI_USAGE_SETTINGS_TRAFFIC_NOTE.toLowerCase()).toContain("canonical adi path");
    expect(AI_USAGE_SETTINGS_TRAFFIC_NOTE).toContain("AAX");
    expect(AI_USAGE_SETTINGS_TRAFFIC_NOTE).not.toMatch(/AAX\s*=\s*admin ai-usage-cost/i);
  });

  it("migrates /admin/ai-usage-cost to canonical AI usage settings in Python WORKBOOK_PATH_MIGRATIONS (TB-1406)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).toContain('"/admin/ai-usage-cost": "/administration/ai-usage"');
  });
});
