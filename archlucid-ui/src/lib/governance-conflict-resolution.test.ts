import { describe, expect, it } from "vitest";

import {
  buildGovernanceConflictResolutionReason,
  getGovernanceConflictLosers,
  getGovernanceConflictWinner,
  resolveGovernanceConflictWhy,
} from "@/lib/governance-conflict-resolution";
import type {
  GovernanceConflictRecord,
  GovernanceResolutionCandidate,
  GovernanceResolutionDecision,
} from "@/types/governance-resolution";

function candidate(
  partial: Partial<GovernanceResolutionCandidate> & Pick<GovernanceResolutionCandidate, "policyPackId" | "assignmentId">,
): GovernanceResolutionCandidate {
  return {
    policyPackId: partial.policyPackId,
    policyPackName: partial.policyPackName ?? "Pack",
    version: partial.version ?? "1.0.0",
    scopeLevel: partial.scopeLevel ?? "Project",
    precedenceRank: partial.precedenceRank ?? 300,
    wasSelected: partial.wasSelected ?? false,
    valueJson: partial.valueJson ?? "\"v\"",
    assignmentId: partial.assignmentId,
    assignedUtc: partial.assignedUtc ?? "2026-01-02T00:00:00Z",
  };
}

describe("governance-conflict-resolution", () => {
  it("picks wasSelected winner when present", () => {
    const winner = candidate({
      policyPackId: "w",
      assignmentId: "a-w",
      wasSelected: true,
      precedenceRank: 100,
    });
    const loser = candidate({
      policyPackId: "l",
      assignmentId: "a-l",
      precedenceRank: 300,
    });

    expect(getGovernanceConflictWinner([loser, winner])).toEqual(winner);
    expect(getGovernanceConflictLosers([loser, winner], winner)).toEqual([loser]);
  });

  it("builds scope-tier reason when ranks differ", () => {
    const high = candidate({ policyPackId: "p", assignmentId: "a1", precedenceRank: 300 });
    const low = candidate({ policyPackId: "q", assignmentId: "a2", precedenceRank: 100 });

    expect(buildGovernanceConflictResolutionReason([low, high])).toContain("scope tier");
  });

  it("prefers matching decision resolutionReason", () => {
    const conflict: GovernanceConflictRecord = {
      itemType: "Metadata",
      itemKey: "tier",
      conflictType: "ValueConflict",
      description: "Values disagreed.",
      candidates: [
        candidate({ policyPackId: "p1", assignmentId: "a1", wasSelected: true }),
        candidate({ policyPackId: "p2", assignmentId: "a2" }),
      ],
    };
    const decisions: GovernanceResolutionDecision[] = [
      {
        itemType: "Metadata",
        itemKey: "tier",
        winningPolicyPackId: "p1",
        winningPolicyPackName: "Project pack",
        winningVersion: "1.0.0",
        winningScopeLevel: "Project",
        resolutionReason: "Project scope outranked tenant.",
        candidates: conflict.candidates,
      },
    ];

    expect(resolveGovernanceConflictWhy(conflict, decisions)).toBe("Project scope outranked tenant.");
  });
});
