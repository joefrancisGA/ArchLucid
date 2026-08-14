import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { getActiveSampleScenario } from "@/lib/samples/registry";
import {
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { AlertRecord } from "@/types/alerts";
import type { GovernanceApprovalRequest, GovernancePromotionRecord } from "@/types/governance-workflow";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

import {
  isDemoRunIdEligibleForStaticFallback,
  isStaticDemoPayloadFallbackActiveForRun,
  isStaticDemoPayloadFallbackEnabled,
} from "./eligibility";

function activeSampleRuleSetVersion(): string {
  return getActiveSampleScenario().ruleSetVersion;
}

export function tryStaticDemoAlertInboxRow(): AlertRecord {
  return {
    alertId: "demo-alert-phi-intake",
    ruleId: "architecture-risk-phi-intake",
    title: "PHI minimization risk — intake path",
    category: "Privacy / regulated data",
    severity: "High",
    status: "Open",
    triggerValue: "Elevated handling risk on unstructured attachments",
    description:
      "Correlates with the PHI minimization storyline in the Claims Intake sample review — monitor exception volume weekly.",
    createdUtc: "2026-01-14T22:01:00.000Z",
    lastUpdatedUtc: null,
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    primaryFindingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    comparedToRunId: null,
    recommendationId: null,
  };
}

/** Merge PHI sample alert into an empty inbox only in demo / buyer-polished builds — not for arbitrary local dev. */
export function shouldMergeOperatorDemoAlertSample(): boolean {
  return isStaticDemoPayloadFallbackEnabled();
}

export function tryStaticDemoGovernanceApprovalRequests(runId: string): GovernanceApprovalRequest[] | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  const activeRuleSetVersion = activeSampleRuleSetVersion();

  return [
    {
      approvalRequestId: "claims-intake-approval-001",
      runId: effectiveRunId,
      manifestVersion: activeRuleSetVersion,
      sourceEnvironment: "dev",
      targetEnvironment: "test",
      status: "Approved",
      requestedBy: "Taylor Morgan",
      reviewedBy: "Jordan Lee",
      requestComment: "Request governed use of the finalized intake review after privacy review.",
      reviewComment: "Approved — maintain weekly monitoring on unstructured attachment volume.",
      requestedUtc: "2026-01-14T21:00:00.000Z",
      reviewedUtc: "2026-01-14T22:05:00.000Z",
    },
  ];
}

export function tryStaticDemoGovernancePromotions(runId: string): GovernancePromotionRecord[] | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  const activeRuleSetVersion = activeSampleRuleSetVersion();

  return [
    {
      promotionRecordId: "demo-promotion-claims-intake-001",
      runId: effectiveRunId,
      manifestVersion: activeRuleSetVersion,
      sourceEnvironment: "dev",
      targetEnvironment: "test",
      promotedBy: "Taylor Morgan",
      approvalRequestId: "claims-intake-approval-001",
      notes: "Governed-use record aligned with this architecture review.",
      promotedUtc: "2026-01-14T22:06:00.000Z",
    },
  ];
}

/** Curated approval lineage for the Claims Intake showcase when the lineage API is unavailable. */
export function tryStaticDemoGovernanceApprovalLineage(approvalRequestId: string): GovernanceLineageResult | null {
  if (isOperatorExperienceFullShellEnv() && !isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  const id = approvalRequestId.trim();

  if (id !== "claims-intake-approval-001") {
    return null;
  }

  const runId = SHOWCASE_STATIC_DEMO_RUN_ID;
  const approvals = tryStaticDemoGovernanceApprovalRequests(runId);
  const promotions = tryStaticDemoGovernancePromotions(runId);

  if (approvals === null || approvals.length === 0) {
    return null;
  }

  const activeRuleSetVersion = activeSampleRuleSetVersion();

  return {
    approvalRequest: approvals[0]!,
    run: {
      runId,
      status: "Finalized",
      createdUtc: "2026-01-12T10:00:00.000Z",
      completedUtc: "2026-01-14T22:00:00.000Z",
      currentManifestVersion: activeRuleSetVersion,
    },
    manifest: {
      manifestVersion: activeRuleSetVersion,
      decisionCount: 12,
      unresolvedIssueCount: 0,
      complianceGapCount: 0,
      signedBy: "Taylor Morgan",
      signedUtc: "2026-01-14T22:00:00.000Z",
      verificationStatus: "Verified",
      recordDigest: "sha256-demo-7f91c4aab3…",
    },
    topFindings: [
      {
        findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
        title: "Residual PHI minimization risk (monitored)",
        engineType: "Policy",
        severity: "High",
        traceCompletenessRatio: 0.92,
      },
    ],
    riskPosture: "Approved with monitoring",
    promotions: promotions ?? [],
  };
}
