import { describe, expect, it } from "vitest";

import { HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON } from "@/lib/feasibility/feasibility-verdict-citation";
import { FEASIBILITY_VERDICT_MISSING_HARD_CITATION_LABEL } from "@/lib/feasibility/resolve-feasibility-verdict-for-display";
import {
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CITATION_REMEDIATION_STEPS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ENFORCEMENT_SURFACES,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_FORBIDDEN_LINK_MARKERS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_HEADINGS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_OVERVIEW_LEAD,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PAGE_SUBTITLE,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_FIELD_ROWS,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_VERDICT_VOCABULARY_ROWS,
} from "@/lib/livelihood-grade-no-help-false-hard-guide-content";
import { LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS } from "@/lib/livelihood-grade-no-hard-infeasible-inventory";
import { verdictTierFromFeasibilityKind, verdictTierLabel } from "@/lib/verdict-taxonomy";

describe("livelihood-grade-no-help-false-hard-guide-content (HEF Phase 2)", () => {
  it("dedupes subtitle from overview lead", () => {
    expect(LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PAGE_SUBTITLE).not.toBe(
      LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_OVERVIEW_LEAD,
    );
  });

  it("bridges feasibility kinds to verdict tiers and citation-needed label", () => {
    const hardRow = LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_VERDICT_VOCABULARY_ROWS.find(
      (row) => row.feasibilityKind === "HardInfeasible",
    );
    const softRow = LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_VERDICT_VOCABULARY_ROWS.find(
      (row) => row.feasibilityKind === "SoftInfeasible",
    );
    const uncitedRow = LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_VERDICT_VOCABULARY_ROWS.find(
      (row) => row.feasibilityKind === "HardInfeasible (uncited)",
    );

    expect(hardRow?.verdictTier).toBe(verdictTierLabel(verdictTierFromFeasibilityKind("HardInfeasible")));
    expect(softRow?.verdictTier).toBe(verdictTierLabel(verdictTierFromFeasibilityKind("SoftInfeasible")));
    expect(uncitedRow?.uiLabel).toBe(FEASIBILITY_VERDICT_MISSING_HARD_CITATION_LABEL);
  });

  it("documents softEnvelope field paths and shared export refusal constant", () => {
    const fieldPaths = LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SOFT_ENVELOPE_FIELD_ROWS.map((row) => row.fieldPath).join(
      " ",
    );
    expect(fieldPaths).toContain("softEnvelope.envelopeDescription");
    expect(fieldPaths).toContain("softEnvelope.softAssumption");
    expect(fieldPaths).toContain("softEnvelope.costOfBeingWrong");

    const remediationJoined = LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_CITATION_REMEDIATION_STEPS.join(" ");
    expect(remediationJoined).toContain(HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON);
  });

  it("maps five enforcement surfaces from LN-002 inventory", () => {
    expect(LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ENFORCEMENT_SURFACES.length).toBe(5);
    expect(LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS.length).toBe(5);
    expect(
      LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ENFORCEMENT_SURFACES.some((surface) =>
        surface.description.includes("evaluateCareerArtifactHonesty"),
      ),
    ).toBe(true);
  });

  it("uses in-app help links only", () => {
    for (const surface of LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_ENFORCEMENT_SURFACES) {
      expect(surface.href.startsWith("/help/")).toBe(true);
      for (const marker of LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_FORBIDDEN_LINK_MARKERS) {
        expect(surface.href).not.toContain(marker);
      }
    }
  });

  it("ships anchored guide headings for TOC and scroll-spy", () => {
    expect(LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_HEADINGS.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_HEADINGS.map((heading) => heading.id));
    expect(ids.size).toBe(LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_GUIDE_HEADINGS.length);
    expect(ids.has("help-false-hard-infeasibility-enforcement-surfaces")).toBe(true);
    expect(ids.has("help-false-hard-infeasibility-citation-remediation")).toBe(true);
  });
});
