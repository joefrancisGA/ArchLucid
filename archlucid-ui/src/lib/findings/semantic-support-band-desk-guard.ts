import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  SEMANTIC_SUPPORT_BAND_DECISION_GRADE_CONTEXT_MARKERS,
  SEMANTIC_SUPPORT_BAND_DESK_CHIP_MARKERS,
  SEMANTIC_SUPPORT_BAND_DESK_GUARDED_PATHS,
} from "@/lib/findings/semantic-support-band-desk-inventory";

export type SemanticSupportBandDeskGuardViolation = {
  readonly relativePath: string;
  readonly message: string;
};

function readUiSource(uiRoot: string, relativePath: string): string {
  return readFileSync(join(uiRoot, "src", relativePath), "utf8");
}

function sourceUsesBandChip(source: string): boolean {
  return SEMANTIC_SUPPORT_BAND_DESK_CHIP_MARKERS.some((marker) => source.includes(marker));
}

function sourceReferencesDecisionGrade(source: string): boolean {
  return SEMANTIC_SUPPORT_BAND_DECISION_GRADE_CONTEXT_MARKERS.some((marker) =>
    source.includes(marker),
  );
}

export function findSemanticSupportBandDeskGuardViolations(
  uiRoot: string,
): SemanticSupportBandDeskGuardViolation[] {
  const violations: SemanticSupportBandDeskGuardViolation[] = [];

  for (const relativePath of SEMANTIC_SUPPORT_BAND_DESK_GUARDED_PATHS) {
    const absolutePath = join(uiRoot, "src", relativePath);

    try {
      statSync(absolutePath);
    }
    catch {
      violations.push({
        relativePath,
        message: "Guarded decision-grade Working surface is missing from the tree.",
      });
      continue;
    }

    const source = readUiSource(uiRoot, relativePath);

    if (!sourceUsesBandChip(source)) {
      violations.push({
        relativePath,
        message:
          "Decision-grade Working surface must import FindingSemanticSupportBandChip or presentDecisionGradeSemanticSupportBand (AS-072).",
      });
    }
  }

  return violations;
}
