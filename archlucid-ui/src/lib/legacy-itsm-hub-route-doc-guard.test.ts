import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH,
  REMOVED_INTEGRATIONS_ITSM_HUB_PATH,
} from "@/lib/integrations-nav-paths";

const REMOVED_ITSM_HUB_PATH_PATTERN = /(?<!\/admin)\/integrations\/itsm(?!\/oauth)/;
const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");
const LEGACY_PATH_ALLOWED_ON_LINE =
  /redirect|retired|legacy|deprecated|bookmark|301|noindex|unreachable|removed|deleted|404|canonical|alias|pre-release|do not reopen|oauth carve|iix/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/information_architecture_assessment_and_backlog.md",
  "docs/architecture/customer_facing_cloud_neutrality_assessment.md",
  "docs/architecture/ui_routes.md",
] as const;

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledRemovedItsmHubPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!REMOVED_ITSM_HUB_PATH_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("legacy-itsm-hub-route-doc-guard (TB-1777 / TB-1778 / TB-1779)", () => {
  it("documents the removed hub path and live OAuth callback carve-out", () => {
    expect(REMOVED_INTEGRATIONS_ITSM_HUB_PATH).toBe("/integrations/itsm");
    expect(ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH).toBe("/integrations/itsm/oauth/callback");
  });

  it("labels /integrations/itsm as removed or retired in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledRemovedItsmHubPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled removed ITSM hub path in ${relativePath}`).toEqual([]);
    }
  });

  it("does not migrate the removed hub to a live product path in WORKBOOK_PATH_MIGRATIONS (TB-1779)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).not.toMatch(/"\/integrations\/itsm"\s*:\s*"\/administration\/connection-status"/);
    expect(catalogSource).not.toMatch(/"\/integrations\/itsm"\s*:\s*"\/integrations\/jira"/);
    expect(catalogSource).toContain('"/admin/integrations/itsm": "/internal/integrations/itsm"');
  });
});
