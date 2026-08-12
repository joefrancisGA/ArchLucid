import { describe, expect, it } from "vitest";

import { parseGovernanceBypassAuditPayload } from "@/lib/governance/governance-bypass-audit-payload";

describe("parseGovernanceBypassAuditPayload", () => {
  it("extracts justification, actor context fields, and blocking finding ids", () => {
    const payload = parseGovernanceBypassAuditPayload(
      JSON.stringify({
        justification: "Emergency production hotfix approved by architecture board.",
        blockingFindingIds: ["finding-a", "finding-b"],
        policyPackId: "pack-default",
        minimumBlockingSeverity: "High",
        gateReason: "PreCommitBlocked",
      }),
    );

    expect(payload.justification).toBe("Emergency production hotfix approved by architecture board.");
    expect(payload.blockingFindingIds).toEqual(["finding-a", "finding-b"]);
    expect(payload.policyPackId).toBe("pack-default");
    expect(payload.minimumBlockingSeverity).toBe("High");
    expect(payload.gateReason).toBe("PreCommitBlocked");
  });

  it("returns empty payload for invalid json", () => {
    const payload = parseGovernanceBypassAuditPayload("not-json");

    expect(payload.justification).toBeNull();
    expect(payload.blockingFindingIds).toEqual([]);
  });
});
