import { describe, expect, it } from "vitest";

import {
  buildCoveragePreviewRequest,
  groupCoveragePreviewAssignments,
  mapNormalizedCloudProvider,
} from "@/lib/coverage-preview";
import type { CoveragePreviewAssignment } from "@/lib/api/coverage-preview-api";

describe("coverage-preview helpers", () => {
  it("mapNormalizedCloudProvider maps wizard values", () => {
    expect(mapNormalizedCloudProvider("azure")).toBe("Azure");
    expect(mapNormalizedCloudProvider("aws")).toBe("Aws");
    expect(mapNormalizedCloudProvider("")).toBe("None");
  });

  it("buildCoveragePreviewRequest omits blank optional fields", () => {
    expect(
      buildCoveragePreviewRequest({
        cloudProvider: "Azure",
        focusedPilotModeEnabled: true,
        securityIntakeAnswer: "   ",
        descriptionText: "",
      }),
    ).toEqual({
      cloudProvider: "Azure",
      focusedPilotModeEnabled: true,
    });
  });

  it("groupCoveragePreviewAssignments buckets by coverage type", () => {
    const assignments: CoveragePreviewAssignment[] = [
      {
        policyPackId: "1",
        policyPackDisplayName: "Security Architecture Baseline",
        policyPackVersion: "1.0.0",
        coverageType: "ProviderNeutralBaseline",
        selectionState: "AlwaysActive",
        includedInRunEvaluation: true,
        evaluationVersion: "preview-v1",
      },
      {
        policyPackId: "2",
        policyPackDisplayName: "SOC 2",
        policyPackVersion: "1.0.0",
        coverageType: "OrganizationRequired",
        selectionState: "RequiredAndLocked",
        includedInRunEvaluation: true,
        evaluationVersion: "preview-v1",
      },
    ];

    const groups = groupCoveragePreviewAssignments(assignments);

    expect(groups.baseline).toHaveLength(1);
    expect(groups.organizationRequired).toHaveLength(1);
    expect(groups.platformOverlay).toHaveLength(0);
  });
});
