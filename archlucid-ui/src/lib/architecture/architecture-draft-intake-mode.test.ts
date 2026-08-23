import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_INTAKE_MODE_CANCEL_LABEL,
  ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL,
  ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD,
  ARCHITECTURE_DRAFT_INTAKE_MODE_SUBMITTED_LEAD,
  ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE,
  ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL,
  architectureDraftAllowsBriefUnlock,
  architectureDraftIntakeModeLead,
  isArchitectureDraftBriefFrozen,
  isArchitectureDraftInReviewIntake,
  isGuidedIntakeAccessBlocked,
  isGuidedIntakeDraftSubmitBlocked,
  resolveGuidedIntakeBlockedRedirectHref,
} from "./architecture-draft-intake-mode";

describe("architecture-draft-intake-mode", () => {
  it("treats only Admitted as active review intake", () => {
    expect(isArchitectureDraftInReviewIntake("Admitted")).toBe(true);
    expect(isArchitectureDraftInReviewIntake("Submitted")).toBe(false);
    expect(isArchitectureDraftInReviewIntake("Drafting")).toBe(false);
    expect(isArchitectureDraftInReviewIntake("RunSpawned")).toBe(false);
    expect(isArchitectureDraftInReviewIntake(null)).toBe(false);
  });

  it("freezes the brief while admitted or submitted", () => {
    expect(isArchitectureDraftBriefFrozen("Admitted")).toBe(true);
    expect(isArchitectureDraftBriefFrozen("Submitted")).toBe(true);
    expect(isArchitectureDraftBriefFrozen("Drafting")).toBe(false);
    expect(isArchitectureDraftBriefFrozen("RunSpawned")).toBe(false);
  });

  it("allows brief unlock only while Admitted", () => {
    expect(architectureDraftAllowsBriefUnlock("Admitted")).toBe(true);
    expect(architectureDraftAllowsBriefUnlock("Submitted")).toBe(false);
    expect(architectureDraftAllowsBriefUnlock("Drafting")).toBe(false);
  });

  it("uses submitted lead copy when the draft is already submitted", () => {
    expect(ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE).toBe("This architecture is already in review intake");
    expect(architectureDraftIntakeModeLead("Admitted")).toBe(ARCHITECTURE_DRAFT_INTAKE_MODE_LEAD);
    expect(architectureDraftIntakeModeLead("Submitted")).toContain("already started a review");
    expect(ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL).toBe("Continue in review intake");
    expect(ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL).toBe("Unlock to edit this brief");
    expect(ARCHITECTURE_DRAFT_INTAKE_MODE_CANCEL_LABEL).toBe("Stay here");
  });

  it("blocks guided intake submit for Submitted and RunSpawned server statuses", () => {
    expect(isGuidedIntakeDraftSubmitBlocked("Submitted")).toBe(true);
    expect(isGuidedIntakeDraftSubmitBlocked("RunSpawned")).toBe(true);
    expect(isGuidedIntakeDraftSubmitBlocked("Admitted")).toBe(false);
    expect(isGuidedIntakeDraftSubmitBlocked("Drafting")).toBe(false);
    expect(isGuidedIntakeDraftSubmitBlocked(null)).toBe(false);
  });

  it("blocks guided intake page access for Submitted and RunSpawned server statuses", () => {
    expect(isGuidedIntakeAccessBlocked("Submitted")).toBe(true);
    expect(isGuidedIntakeAccessBlocked("RunSpawned")).toBe(true);
    expect(isGuidedIntakeAccessBlocked("Admitted")).toBe(false);
  });

  it("resolves blocked intake redirects to the review or architecture draft", () => {
    expect(resolveGuidedIntakeBlockedRedirectHref("arch-001", "run-001")).toBe(
      "/architecture/reviews/run-001",
    );
    expect(resolveGuidedIntakeBlockedRedirectHref("arch-001", null)).toBe(
      "/architecture/architectures/arch-001",
    );
  });
});
