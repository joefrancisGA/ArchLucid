import { describe, expect, it } from "vitest";

import { canApproveRemediationPatternVersion } from "@/lib/remediation-pattern-sod";
import { REMEDIATION_PATTERN_STATUS } from "@/lib/remediation-pattern-status";
import type { CurrentPrincipal } from "@/lib/current-principal";

const principal: CurrentPrincipal = {
  provenance: "auth-me",
  name: "author@example.com",
  roleClaimValues: [],
  primaryAppRole: null,
  maxAuthority: "ExecuteAuthority",
  authorityRank: 2,
  hasEnterpriseOperatorSurfaces: true,
  hasCommittedArchitectureReview: true,
  hasRecognizedArchLucidRole: true,
  permissionClaimValues: [],
  meClaims: [
    { type: "email", value: "author@example.com" },
    { type: "oid", value: "same-oid" },
    { type: "tid", value: "tenant" },
  ],
};

describe("remediation-pattern-sod", () => {
  it("blocks approval when author matches current actor", () => {
    const allowed = canApproveRemediationPatternVersion(
      {
        versionId: "v1",
        patternId: "p1",
        version: "1.0.0",
        status: REMEDIATION_PATTERN_STATUS.underReview,
        controlObjective: "test",
        authorActorKey: "jwt:tenant:same-oid",
        createdUtc: new Date().toISOString(),
        updatedUtc: new Date().toISOString(),
      },
      principal,
      true,
    );

    expect(allowed).toBe(false);
  });
});
