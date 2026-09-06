import type { RemediationInstanceStatus, RemediationWorkbenchColumn } from "@/lib/infra-evidence/infra-evidence-remediation-types";

export function mapRemediationInstanceStatusToColumn(status: RemediationInstanceStatus): RemediationWorkbenchColumn {
  switch (status) {
    case "Classified":
      return "draft";
    case "PreflightPassed":
    case "PreflightBlocked":
      return "preflight";
    case "Approved":
    case "WaveAssigned":
      return "approved";
    case "Executed":
      return "executed";
    case "Verified":
    case "VerificationFailed":
      return "verified";
    case "Closed":
      return "closed";
    default:
      return "draft";
  }
}

export function canRunRemediationPreflight(status: RemediationInstanceStatus): boolean {
  return status === "Classified";
}

export function canApproveRemediationInstance(status: RemediationInstanceStatus): boolean {
  return status === "PreflightPassed";
}

export function canAssignRemediationWave(status: RemediationInstanceStatus): boolean {
  return status === "Approved";
}

export function canExecuteRemediationInstance(status: RemediationInstanceStatus): boolean {
  return status === "WaveAssigned";
}

export function canVerifyRemediationInstance(status: RemediationInstanceStatus): boolean {
  return status === "Executed";
}

export function canCloseRemediationInstance(status: RemediationInstanceStatus): boolean {
  return status === "Verified" || status === "VerificationFailed";
}

export function isRemediationTransitionBlocked(status: RemediationInstanceStatus, blockers: readonly string[]): boolean {
  if (status === "PreflightBlocked")
    return true;

  return blockers.length > 0;
}
