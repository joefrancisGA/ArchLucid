import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  isQuickDecisionPolicyBlockingFinding,
  partitionQuickDecisionFindings,
} from "@/lib/quick-decision-finding-merge-and-sort";

function finding(partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">): QuickDecisionFinding {
  return {
    findingId: partial.findingId,
    title: partial.title ?? "Title",
    recommendation: partial.recommendation ?? "",
    severityValue: partial.severityValue ?? 1,
    findingOrder: partial.findingOrder ?? 0,
    aiReasoning: partial.aiReasoning ?? { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: partial.enforcementTier ?? null,
    enforcementTierStored: partial.enforcementTierStored,
    ...partial,
  };
}

describe("quick-decision-finding-merge-and-sort enforcement tier honesty", () => {
  it("does not treat missing enforcement tier as policy-blocking", () => {
    const row = finding({ findingId: "f-1", enforcementTier: null, enforcementTierStored: false });

    expect(isQuickDecisionPolicyBlockingFinding(row)).toBe(false);

    const partition = partitionQuickDecisionFindings([row]);

    expect(partition.policyViolations).toHaveLength(0);
    expect(partition.enforcementTierUnspecified).toHaveLength(1);
  });

  it("partitions advisory and policy violation tiers", () => {
    const partition = partitionQuickDecisionFindings([
      finding({ findingId: "block", enforcementTier: "PolicyViolation", enforcementTierStored: true }),
      finding({ findingId: "note", enforcementTier: "Advisory", enforcementTierStored: true }),
    ]);

    expect(partition.policyViolations.map((f) => f.findingId)).toEqual(["block"]);
    expect(partition.advisoryNotes.map((f) => f.findingId)).toEqual(["note"]);
  });
});
