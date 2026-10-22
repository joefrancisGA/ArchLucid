import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import type { PilotRunDeltasProofSummaryJson } from "@/lib/pilot-proof-readiness";
import { SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";

import { isDemoRunIdEligibleForStaticFallback, isShowcaseSpineStaticPayloadActiveForRun } from "./eligibility";

/** Curated pilot-run-deltas proof fields for showcase slugs when live GUID APIs are unavailable. */
export function tryStaticDemoPilotRunDeltas(runId: string): PilotRunDeltasProofSummaryJson | null {
  if (!isShowcaseSpineStaticPayloadActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId.trim());

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return {
    isDemoTenant: true,
    proofPackageCompleteness: {
      sponsorProofReadiness: "DemoOnly",
      demoTenantWarningRequired: true,
      proofSendability: "NotSendable",
      publishingTier: "Illustrative",
      roiEvidenceConfidence: "Low",
      agentOutputPilotStrictEvidenceSatisfied: true,
      llmCallCount: 0,
      llmCallCountResolved: true,
      roiBaselineInputs: {
        projectedDollarClaimsSponsorSafe: false,
        sponsorSafeFallbackCopy:
          "Illustrative sample review — replace with a live-tenant run before external sponsor circulation.",
      },
    },
    governedFindingCoverage: {
      isAvailable: true,
      governedCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
      totalDecisionGradeCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
      governedPercentage: 100,
      advisoryCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount,
    },
  };
}
