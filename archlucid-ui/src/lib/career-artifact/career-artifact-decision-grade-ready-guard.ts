import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  CAREER_ARTIFACT_DECISION_GRADE_CONTEXT_MARKERS,
  CAREER_ARTIFACT_DECISION_GRADE_READY_GUARDED_PATHS,
  CAREER_ARTIFACT_DECISION_GRADE_READY_MITIGATION_MARKERS,
  CAREER_ARTIFACT_READY_TAG_PATTERNS,
} from "@/lib/career-artifact/career-artifact-decision-grade-ready-inventory";

export type CareerArtifactDecisionGradeReadyViolation = {
  readonly relativePath: string;
  readonly message: string;
};

function readSource(uiRoot: string, relativePath: string): string {
  return readFileSync(join(uiRoot, "src", relativePath), "utf8");
}

function usesReadyTag(contents: string): boolean {
  return CAREER_ARTIFACT_READY_TAG_PATTERNS.some((pattern) => contents.includes(pattern));
}

function referencesDecisionGrade(contents: string): boolean {
  return CAREER_ARTIFACT_DECISION_GRADE_CONTEXT_MARKERS.some((marker) => contents.includes(marker));
}

function hasDecisionGradeReadyMitigation(contents: string): boolean {
  return CAREER_ARTIFACT_DECISION_GRADE_READY_MITIGATION_MARKERS.some((marker) => contents.includes(marker));
}

export function findCareerArtifactDecisionGradeReadyViolations(
  uiRoot: string,
): CareerArtifactDecisionGradeReadyViolation[] {
  const violations: CareerArtifactDecisionGradeReadyViolation[] = [];

  for (const relativePath of CAREER_ARTIFACT_DECISION_GRADE_READY_GUARDED_PATHS) {
    const contents = readSource(uiRoot, relativePath);

    if (!usesReadyTag(contents)) {
      continue;
    }

    if (!referencesDecisionGrade(contents)) {
      continue;
    }

    if (hasDecisionGradeReadyMitigation(contents)) {
      continue;
    }

    violations.push({
      relativePath,
      message:
        "StatusTag kind=ready is banned on decision-grade career surfaces without an insight-density honesty line (FC-05).",
    });
  }

  return violations;
}
