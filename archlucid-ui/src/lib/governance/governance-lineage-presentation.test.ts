import { describe, expect, it } from "vitest";

import {
  buildGovernanceLineageManifestMetricFields,
  deriveGovernanceLineageVersionAssertion,
  governanceApprovalStatusTagPresentation,
  governanceLineageReviewCheckpointStatusTagPresentation,
  governanceLineageVerificationStatusTagPresentation,
  governanceRiskPostureStatusTagPresentation,
} from "@/lib/governance/governance-lineage-presentation";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

function sampleLineage(overrides: Partial<GovernanceLineageResult> = {}): GovernanceLineageResult {
  return {
    approvalRequest: {
      approvalRequestId: "approval-1",
      runId: "customer-intake-modernization",
      manifestVersion: "3.4.1",
      sourceEnvironment: "dev",
      targetEnvironment: "test",
      status: "Approved",
      requestedBy: "Alex Kim",
      reviewedBy: "Taylor Morgan",
      requestComment: "Promote claims intake",
      reviewComment: null,
      requestedUtc: "2026-01-14T20:00:00.000Z",
      reviewedUtc: "2026-01-14T22:00:00.000Z",
    },
    run: {
      runId: "customer-intake-modernization",
      status: "Finalized",
      createdUtc: "2026-01-12T10:00:00.000Z",
      completedUtc: "2026-01-14T22:00:00.000Z",
      currentManifestVersion: "3.4.1",
    },
    manifest: {
      manifestVersion: "3.4.1",
      decisionCount: 12,
      unresolvedIssueCount: 2,
      complianceGapCount: 1,
      signedBy: "Taylor Morgan",
      signedUtc: "2026-01-14T22:00:00.000Z",
      verificationStatus: "Verified",
      recordDigest: "sha256-demo-7f91c4aab3…",
    },
    topFindings: [
      {
        findingId: "sensitive-data-minimization-risk",
        title: "Residual PHI minimization risk",
        engineType: "Policy",
        severity: "High",
        traceCompletenessRatio: 0.92,
      },
      {
        findingId: "logging-gap",
        title: "Logging retention gap",
        engineType: "Policy",
        severity: "Low",
        traceCompletenessRatio: 0.8,
      },
    ],
    riskPosture: "Approved with monitoring",
    promotions: [
      {
        promotionRecordId: "promo-1",
        runId: "customer-intake-modernization",
        manifestVersion: "3.4.1",
        sourceEnvironment: "dev",
        targetEnvironment: "test",
        promotedBy: "Taylor Morgan",
        approvalRequestId: "approval-1",
        notes: null,
        promotedUtc: "2026-01-14T22:06:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("governance-lineage-presentation", () => {
  it("maps approval and risk posture statuses to canonical StatusTag kinds", () => {
    expect(governanceApprovalStatusTagPresentation("Approved")).toEqual({
      kind: "approved",
      label: "Approved",
    });
    expect(governanceRiskPostureStatusTagPresentation("Approved with monitoring")).toEqual({
      kind: "approved-with-monitoring",
      label: "Approved with monitoring",
    });
    expect(governanceRiskPostureStatusTagPresentation("Critical")).toEqual({
      kind: "blocked",
      label: "Critical",
    });
    expect(governanceLineageReviewCheckpointStatusTagPresentation("Finalized")).toEqual({
      kind: "ready",
      label: "Finalized",
    });
    expect(governanceLineageReviewCheckpointStatusTagPresentation("Failed")).toEqual({
      kind: "blocked",
      label: "Failed",
    });
    expect(governanceLineageVerificationStatusTagPresentation("Verified")).toEqual({
      kind: "ready",
      label: "Verified",
    });
  });

  it("derives version alignment between approval and promotion", () => {
    const aligned = deriveGovernanceLineageVersionAssertion(sampleLineage());

    expect(aligned.primaryVersion).toBe("3.4.1");
    expect(aligned.approvedAndPromotedMatch).toBe(true);

    const mismatched = deriveGovernanceLineageVersionAssertion(
      sampleLineage({
        promotions: [
          {
            promotionRecordId: "promo-1",
            runId: "customer-intake-modernization",
            manifestVersion: "3.4.0",
            sourceEnvironment: "dev",
            targetEnvironment: "test",
            promotedBy: "Taylor Morgan",
            approvalRequestId: "approval-1",
            notes: null,
            promotedUtc: "2026-01-14T22:06:00.000Z",
          },
        ],
      }),
    );

    expect(mismatched.approvedAndPromotedMatch).toBe(false);

    const manifestDrift = deriveGovernanceLineageVersionAssertion(
      sampleLineage({
        manifest: {
          ...sampleLineage().manifest!,
          manifestVersion: "3.5.0",
        },
      }),
    );

    expect(manifestDrift.primaryVersion).toBe("3.5.0");
    expect(manifestDrift.approvedAndPromotedMatch).toBe(false);
  });

  it("maps each manifest metric row to a distinct manifest property", () => {
    const fields = buildGovernanceLineageManifestMetricFields({
      manifest: sampleLineage().manifest!,
      runId: "customer-intake-modernization",
    });

    expect(fields.map((field) => field.manifestProperty)).toEqual([
      "decisionCount",
      "unresolvedIssueCount",
      "complianceGapCount",
    ]);
    expect(new Set(fields.map((field) => field.manifestProperty)).size).toBe(3);
    expect(fields[0]?.presentation.count).toBe(12);
    expect(fields[1]?.presentation.count).toBe(2);
    expect(fields[2]?.presentation.count).toBe(1);
  });
});
