import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { stableAssumptionIdFromText } from "./stable-assumption-id";
import { resolveClientAwareCommitBlockedReason } from "./resolve-client-commit-blocked-reason";

function sampleFinding(
  partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">,
): QuickDecisionFinding {
  return {
    findingId: partial.findingId,
    title: partial.title ?? "Sample finding",
    recommendation: partial.recommendation ?? "",
    severityValue: partial.severityValue ?? 1,
    findingOrder: partial.findingOrder ?? 0,
    isMuted: partial.isMuted ?? false,
    muteReason: partial.muteReason ?? null,
    enforcementTier: partial.enforcementTier ?? "Blocking",
    humanReviewStatus: partial.humanReviewStatus ?? null,
    trustLabel: partial.trustLabel ?? null,
    policyRuleId: partial.policyRuleId ?? null,
    evidenceRefCount: partial.evidenceRefCount ?? 0,
    confidenceLevel: partial.confidenceLevel ?? null,
    aiReasoning: partial.aiReasoning ?? {
      reasoningTrace: "",
      wireJson: "{}",
    },
  };
}

describe("resolve-client-commit-blocked-reason", () => {
  it("clears finalize block when existential assumptions are acknowledged", () => {
    const existentialText = "RTO assumption not documented";
    const existentialId = stableAssumptionIdFromText(existentialText);
    const blocked = resolveClientAwareCommitBlockedReason({
      serverCommitBlockedReason: "1 existential assumption still need confirmation before finalize.",
      finalizeAssumptionGateApplies: true,
      findings: [
        sampleFinding({
          findingId: "a1",
          title: existentialText,
          recommendation: "Recovery target is assumed without evidence",
        }),
      ],
      blockingFindingCount: 0,
      acknowledgedAssumptionIds: new Set(),
      requestAssumptionTexts: [],
    });

    expect(blocked).not.toBeNull();

    const cleared = resolveClientAwareCommitBlockedReason({
      serverCommitBlockedReason: "1 existential assumption still need confirmation before finalize.",
      finalizeAssumptionGateApplies: true,
      findings: [
        sampleFinding({
          findingId: "a1",
          title: existentialText,
          recommendation: "Recovery target is assumed without evidence",
        }),
      ],
      blockingFindingCount: 0,
      acknowledgedAssumptionIds: new Set([existentialId]),
      requestAssumptionTexts: [],
    });

    expect(cleared).toBeNull();
  });
});
