import { describe, expect, it } from "vitest";

import {
  canApproveRemediationInstance,
  canRunRemediationPreflight,
  isRemediationTransitionBlocked,
  mapRemediationInstanceStatusToColumn,
} from "@/lib/infra-evidence/infra-evidence-remediation-stages";

describe("infra-evidence-remediation-stages", () => {
  it("maps lifecycle statuses into workbench columns", () => {
    expect(mapRemediationInstanceStatusToColumn("Classified")).toBe("draft");
    expect(mapRemediationInstanceStatusToColumn("PreflightBlocked")).toBe("preflight");
    expect(mapRemediationInstanceStatusToColumn("WaveAssigned")).toBe("approved");
    expect(mapRemediationInstanceStatusToColumn("VerificationFailed")).toBe("verified");
  });

  it("blocks transitions when preflight failed or blockers are present", () => {
    expect(canRunRemediationPreflight("Classified")).toBe(true);
    expect(canApproveRemediationInstance("PreflightPassed")).toBe(true);
    expect(canApproveRemediationInstance("PreflightBlocked")).toBe(false);
    expect(isRemediationTransitionBlocked("PreflightBlocked", [])).toBe(true);
    expect(isRemediationTransitionBlocked("PreflightPassed", ["exception active"])).toBe(true);
  });
});
