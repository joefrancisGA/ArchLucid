import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor/sponsor-report-pilot-roi-measurement-help";

const LEGACY_PILOT_ROI_MODEL_PATH_PATTERN = /\/help\/pilot-roi-model/g;
const LEGACY_PATH_ALLOWED_ON_LINE = /redirect|retired|legacy|unreachable|remove|bookmark|fold|migration|→|canonicalize|done/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/go-to-market/SPONSOR_SPONSOR_BRIEF.md",
  "docs/library/customer-facing/PILOT_GUIDE.md",
  "docs/library/CLI_USAGE.md",
  "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md",
] as const;

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledLegacyPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!LEGACY_PILOT_ROI_MODEL_PATH_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("legacy-pilot-roi-model-help-doc-guard (PI fold / TB-1389)", () => {
  it("documents the canonical pilot ROI measurement help anchor", () => {
    expect(SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF).toBe(
      "/help/sponsor-report#pilot-roi-measurement",
    );
  });

  it("labels the legacy pilot-roi-model path redirect-only in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy pilot-roi-model path in ${relativePath}`).toEqual([]);
    }
  });
});
