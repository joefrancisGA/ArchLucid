import { describe, expect, it } from "vitest";

import {
  buildCoveragePreviewRequest,
  COVERAGE_PREVIEW_CLOUD_NOT_STORED_MESSAGE,
  COVERAGE_PREVIEW_CLOUD_UNRECOGNIZED_MESSAGE,
  COVERAGE_PREVIEW_POLICY_PACK_VERSION_NOT_STORED_MESSAGE,
  formatCoveragePreviewPolicyPackVersion,
  groupCoveragePreviewAssignments,
  mapNormalizedCloudProvider,
  resolveCoveragePreviewCloudHonesty,
} from "@/lib/coverage-preview";
import type { CoveragePreviewAssignment } from "@/lib/api/coverage-preview-api";

describe("coverage-preview helpers", () => {
  it("resolveCoveragePreviewCloudHonesty surfaces omitted cloud without inventing a provider", () => {
    expect(resolveCoveragePreviewCloudHonesty(undefined)).toBe(COVERAGE_PREVIEW_CLOUD_NOT_STORED_MESSAGE);
    expect(resolveCoveragePreviewCloudHonesty("")).toBe(COVERAGE_PREVIEW_CLOUD_NOT_STORED_MESSAGE);
    expect(resolveCoveragePreviewCloudHonesty("  ")).toBe(COVERAGE_PREVIEW_CLOUD_NOT_STORED_MESSAGE);
    expect(resolveCoveragePreviewCloudHonesty("Azure")).toBeNull();
    expect(resolveCoveragePreviewCloudHonesty("Oracle")).toBe(COVERAGE_PREVIEW_CLOUD_UNRECOGNIZED_MESSAGE);
  });

  it("formatCoveragePreviewPolicyPackVersion surfaces missing versions honestly", () => {
    expect(formatCoveragePreviewPolicyPackVersion("")).toBe(
      COVERAGE_PREVIEW_POLICY_PACK_VERSION_NOT_STORED_MESSAGE,
    );
    expect(formatCoveragePreviewPolicyPackVersion("  ")).toBe(
      COVERAGE_PREVIEW_POLICY_PACK_VERSION_NOT_STORED_MESSAGE,
    );
    expect(formatCoveragePreviewPolicyPackVersion("2.4.1")).toBe("2.4.1");
  });

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

  it("buildCoveragePreviewRequest includes excluded user overrides", () => {
    expect(
      buildCoveragePreviewRequest({
        cloudProvider: "Azure",
        focusedPilotModeEnabled: true,
        userOverrides: [
          { policyPackId: "1", excluded: true, exclusionReason: " Pilot " },
          { policyPackId: "2", excluded: false, exclusionReason: "" },
        ],
      }),
    ).toEqual({
      cloudProvider: "Azure",
      focusedPilotModeEnabled: true,
      userOverrides: [{ policyPackId: "1", excluded: true, exclusionReason: "Pilot" }],
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
