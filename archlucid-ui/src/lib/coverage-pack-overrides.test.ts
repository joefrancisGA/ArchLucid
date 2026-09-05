import { describe, expect, it } from "vitest";

import {
  findCoveragePackOverride,
  isCoveragePreviewAssignmentExcludable,
  toCoveragePreviewUserOverrides,
  upsertCoveragePackOverride,
  validateCoveragePackOverrides,
} from "@/lib/coverage-pack-overrides";
import type { CoveragePreviewAssignment } from "@/lib/api/coverage-preview-api";

describe("coverage-pack-overrides", () => {
  const optionalAssignment: CoveragePreviewAssignment = {
    policyPackId: "22222222-2222-2222-2222-222222222222",
    policyPackDisplayName: "Azure Well-Architected Framework",
    policyPackVersion: "1.0.0",
    coverageType: "PlatformOverlay",
    selectionState: "OptionalAndSelected",
    includedInRunEvaluation: true,
    evaluationVersion: "preview-v1",
  };

  it("isCoveragePreviewAssignmentExcludable blocks baseline and org-required rows", () => {
    expect(isCoveragePreviewAssignmentExcludable(optionalAssignment)).toBe(true);
    expect(
      isCoveragePreviewAssignmentExcludable({
        ...optionalAssignment,
        selectionState: "AlwaysActive",
        coverageType: "ProviderNeutralBaseline",
      }),
    ).toBe(false);
    expect(
      isCoveragePreviewAssignmentExcludable({
        ...optionalAssignment,
        selectionState: "RequiredAndLocked",
        coverageType: "OrganizationRequired",
      }),
    ).toBe(false);
  });

  it("validateCoveragePackOverrides requires reasons for excluded packs", () => {
    expect(
      validateCoveragePackOverrides([
        { policyPackId: "1", excluded: true, exclusionReason: "   " },
      ]),
    ).toBe("Add a short reason for each excluded policy pack.");
    expect(
      validateCoveragePackOverrides([
        { policyPackId: "1", excluded: true, exclusionReason: "Pilot scope" },
      ]),
    ).toBeNull();
  });

  it("upsertCoveragePackOverride merges by policyPackId", () => {
    const next = upsertCoveragePackOverride(
      [{ policyPackId: "1", excluded: false, exclusionReason: "" }],
      { policyPackId: "1", excluded: true, exclusionReason: "Out of scope" },
    );

    expect(findCoveragePackOverride(next, "1")).toEqual({
      policyPackId: "1",
      excluded: true,
      exclusionReason: "Out of scope",
    });
  });

  it("toCoveragePreviewUserOverrides returns only excluded rows", () => {
    expect(
      toCoveragePreviewUserOverrides([
        { policyPackId: "1", excluded: true, exclusionReason: " Pilot " },
        { policyPackId: "2", excluded: false, exclusionReason: "" },
      ]),
    ).toEqual([{ policyPackId: "1", excluded: true, exclusionReason: "Pilot" }]);
  });
});
