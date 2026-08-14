import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CANONICAL_SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH,
  REMOVED_RUN_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID,
  RETIRED_RUN_ARTIFACT_PREVIEW_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-run-artifact-preview";
import {
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE,
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH,
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-signed-record-artifact-preview";

const RETIRED_RER_PATH_PATTERN =
  /\/(?:architecture\/)?reviews\/\[runId\]\/artifacts\/\[artifactId\]|\/runs\/\[runId\]\/artifacts\/\[artifactId\]/;
const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");
const LEGACY_PATH_ALLOWED_ON_LINE =
  /redirect|retired|legacy|deprecated|bookmark|301|noindex|unreachable|removed|deleted|404|ghost|rer|gar|mam|canonical|absent|do not|preview href/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/information_architecture_assessment_and_backlog.md",
  "docs/architecture/ui_routes.md",
] as const;

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledRetiredRunArtifactPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!RETIRED_RER_PATH_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("legacy-run-artifact-preview-route-doc-guard (TB-1823 / TB-1825 / TB-1950)", () => {
  it("keeps GAR as the live preview SoT and RER as a removed traffic row", () => {
    expect(REMOVED_RUN_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID).toBe("RER");
    expect(RETIRED_RUN_ARTIFACT_PREVIEW_TRAFFIC_PATH).toBe(
      "/architecture/reviews/[reviewId]/artifacts/[artifactId]",
    );
    expect(SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID).toBe("GAR");
    expect(SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH).toBe(
      CANONICAL_SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH,
    );
    expect(SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE).toContain("RER bookmark redirect removed");
    expect(SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE).toContain("GAR");
  });

  it("labels run-scoped artifact preview paths as retired or removed in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledRetiredRunArtifactPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled retired RER path in ${relativePath}`).toEqual([]);
    }
  });

  it("keeps RER in REDIRECT_ONLY_APP_PATHS and migrates signed-records artifacts to governance (TB-1823)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).toContain('"/architecture/reviews/[reviewId]/artifacts/[artifactId]"');
    expect(catalogSource).toContain(
      '"/signed-records/[manifestId]/artifacts/[artifactId]":',
    );
    expect(catalogSource).toContain(
      '"/governance/sealed-records/[manifestId]/artifacts/[artifactId]"',
    );
  });
});
