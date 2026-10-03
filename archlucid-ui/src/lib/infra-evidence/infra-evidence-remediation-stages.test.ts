import { describe, expect, it } from "vitest";

import {
  canApproveRemediationInstance,
  canAttestChangeImplemented,
  canCloseRemediationInstance,
  canRunRemediationPreflight,
  canVerifyRemediationInstance,
  isRemediationTransitionBlocked,
  mapRemediationInstanceStatusToColumn,
} from "@/lib/infra-evidence/infra-evidence-remediation-stages";

describe("infra-evidence-remediation-stages", () => {
  it("maps lifecycle statuses into workbench columns", () => {
    expect(mapRemediationInstanceStatusToColumn("Classified")).toBe("draft");
    expect(mapRemediationInstanceStatusToColumn("PreflightBlocked")).toBe("preflight");
    expect(mapRemediationInstanceStatusToColumn("WaveAssigned")).toBe("approved");
    expect(mapRemediationInstanceStatusToColumn("Executed")).toBe("executed");
    expect(mapRemediationInstanceStatusToColumn("ChangeImplemented")).toBe("implemented");
    expect(mapRemediationInstanceStatusToColumn("Verified")).toBe("verified");
    expect(mapRemediationInstanceStatusToColumn("VerificationFailed")).toBe("verification-failed");
  });

  it("gates attest, verify, and close on their lifecycle statuses", () => {
    expect(canAttestChangeImplemented("Executed")).toBe(true);
    expect(canAttestChangeImplemented("ChangeImplemented")).toBe(false);
    expect(canVerifyRemediationInstance("ChangeImplemented")).toBe(true);
    expect(canVerifyRemediationInstance("Executed")).toBe(false);
    expect(canCloseRemediationInstance("Verified")).toBe(true);
    expect(canCloseRemediationInstance("VerificationFailed")).toBe(false);
  });

  it("blocks transitions when preflight failed or blockers are present", () => {
    expect(canRunRemediationPreflight("Classified")).toBe(true);
    expect(canApproveRemediationInstance("PreflightPassed")).toBe(true);
    expect(canApproveRemediationInstance("PreflightBlocked")).toBe(false);
    expect(isRemediationTransitionBlocked("PreflightBlocked", [])).toBe(true);
    expect(isRemediationTransitionBlocked("PreflightPassed", ["exception active"])).toBe(true);
  });
});
