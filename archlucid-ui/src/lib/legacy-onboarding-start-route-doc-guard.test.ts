import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import {
  CANONICAL_ONBOARDING_PATH,
  LEGACY_ONBOARDING_START_PATH,
} from "@/lib/legacy-onboarding-start-route";
import { RETIRED_REDIRECT_SHIM_TRAFFIC_PATHS } from "@/lib/ui-route-traffic-retired-redirect-shims";
import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

const LEGACY_ONBOARDING_START_PATH_PATTERN = /\/onboarding\/start/g;
const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");
const LEGACY_PATH_ALLOWED_ON_LINE =
  /redirect|retired|legacy|deprecated|bookmark|301|noindex|unreachable|removed|canonical|alias|arf|first-review-guide/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/information_architecture_assessment_and_backlog.md",
  "docs/architecture/customer_facing_cloud_neutrality_assessment.md",
  "docs/architecture/ui_routes.md",
  "docs/library/ONBOARDING_WIZARD.md",
] as const;

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledLegacyOnboardingStartPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!LEGACY_ONBOARDING_START_PATH_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("legacy-onboarding-start-route-doc-guard (TB-1803)", () => {
  it("documents the canonical first-review-guide path as the onboarding hub URL", () => {
    expect(CANONICAL_ONBOARDING_PATH).toBe(FIRST_REVIEW_GUIDE_PATH);
    expect(CANONICAL_ONBOARDING_PATH).toBe("/architecture/first-review-guide");
    expect(LEGACY_ONBOARDING_START_PATH).toBe("/onboarding/start");
  });

  it("labels /onboarding/start as retired or redirect-only in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyOnboardingStartPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy onboarding-start path in ${relativePath}`).toEqual([]);
    }
  });

  it("does not score /onboarding/start as a traffic workbook row", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());

    expect(RETIRED_REDIRECT_SHIM_TRAFFIC_PATHS).toContain(LEGACY_ONBOARDING_START_PATH);
    expect(rows.find((row) => row.path === LEGACY_ONBOARDING_START_PATH)).toBeUndefined();
  });

  it("migrates /onboarding/start to first-review-guide in Python WORKBOOK_PATH_MIGRATIONS (TB-1801)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).toContain('"/onboarding/start": "/architecture/first-review-guide"');
  });
});
