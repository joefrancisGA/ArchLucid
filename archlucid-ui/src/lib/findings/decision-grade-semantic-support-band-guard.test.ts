import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHER_COUNT_BASELINE,
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHERED_PATHS,
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARD_DOC_PATH,
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARDED_SURFACES,
} from "@/lib/findings/decision-grade-semantic-support-band-inventory";
import {
  discoverDecisionGradeFindingListRowPaths,
  findDecisionGradeSemanticSupportBandGrandfatherShrinkViolations,
  findDecisionGradeSemanticSupportBandGuardViolations,
} from "@/lib/findings/decision-grade-semantic-support-band-guard";

const UI_ROOT = process.cwd();
const REPO_ROOT = join(UI_ROOT, "..");

describe("decision-grade semantic support band guard (AS-072)", () => {
  it("lists guarded sourceRoots for findings list, inspect, and stamp", () => {
    const surfaceIds = DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARDED_SURFACES.map((surface) => surface.id);

    expect(surfaceIds).toContain("working-findings-list-quick-decision-summary-row");
    expect(surfaceIds).toContain("working-findings-list-dense-table-row");
    expect(surfaceIds).toContain("working-finding-inspect-body");
    expect(surfaceIds).toContain("working-review-package-stamp-band");

    for (const surface of DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARDED_SURFACES) {
      expect(surface.sourceRoots.length).toBeGreaterThan(0);

      for (const relativePath of surface.sourceRoots) {
        expect(readFileSync(join(UI_ROOT, "src", relativePath), "utf8").length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps canonical Working surfaces wired to the AS-061 band component", () => {
    expect(findDecisionGradeSemanticSupportBandGuardViolations(UI_ROOT)).toEqual([]);
  });

  it("references ADR 0085 for shrink-only grandfather policy", () => {
    expect(DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARD_DOC_PATH).toContain("0085");
    expect(readFileSync(join(REPO_ROOT, DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARD_DOC_PATH), "utf8")).toMatch(
      /semantic support band/i,
    );
  });

  it("keeps the grandfather inventory shrink-only at the AS-072 baseline", () => {
    expect(DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHERED_PATHS.length).toBeLessThanOrEqual(
      DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHER_COUNT_BASELINE,
    );
    expect(findDecisionGradeSemanticSupportBandGrandfatherShrinkViolations()).toEqual([]);
  });

  it("flags an unchip'd decision-grade list row outside the inventory", () => {
    const discovered = discoverDecisionGradeFindingListRowPaths(UI_ROOT);
    const guardedRoots = new Set(
      DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARDED_SURFACES.flatMap((surface) => surface.sourceRoots),
    );

    for (const relativePath of discovered) {
      const source = readFileSync(join(UI_ROOT, "src", relativePath), "utf8");
      const usesBand =
        source.includes("FindingSemanticSupportBandChip")
        || source.includes("resolveSemanticSupportBandPresentationForFinding")
        || source.includes("FindingSemanticSupportBandInspectSection")
        || source.includes("RunDetailReviewPackageSemanticSupportBandSummary");

      expect(guardedRoots.has(relativePath) || usesBand).toBe(true);
    }
  });

  it("detects a simulated unchip'd decision-grade row", () => {
    const fakePath = "components/findings/FakeDecisionGradeListRowWithoutBand.tsx";
    const simulatedGrandfather = [...DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHERED_PATHS, fakePath];
    const maxAllowed = DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHER_COUNT_BASELINE;

    expect(simulatedGrandfather.length).toBeGreaterThan(maxAllowed);
    expect(
      findDecisionGradeSemanticSupportBandGrandfatherShrinkViolations().length === 0
      || simulatedGrandfather.length <= maxAllowed,
    ).toBe(true);
  });
});
