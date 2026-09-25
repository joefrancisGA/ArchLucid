import {
  canApproveRemediationInstance,
  canAssignRemediationWave,
  canCloseRemediationInstance,
  canExecuteRemediationInstance,
  canRunRemediationPreflight,
  canVerifyRemediationInstance,
  isRemediationTransitionBlocked,
} from "@/lib/infra-evidence/infra-evidence-remediation-stages";
import type { RemediationInstanceStatus } from "@/lib/infra-evidence/infra-evidence-remediation-types";

export type RemediationLifecycleAction =
  | "create"
  | "preflight"
  | "approve"
  | "assignWave"
  | "execute"
  | "verify"
  | "close";

export function remediationLifecycleActionBlockedReason(
  action: RemediationLifecycleAction,
  context: {
    readonly actionBusy: boolean;
    readonly selectedStatus: RemediationInstanceStatus | null;
    readonly transitionsBlocked: boolean;
    readonly findingIdInput: string;
    readonly selectedWaveId: string;
    readonly selectedSnapshotId: string;
  },
): string | null {
  if (context.actionBusy) {
    return "Wait for the current remediation action to finish.";
  }

  switch (action) {
    case "create":
      return context.findingIdInput.trim().length === 0
        ? "Enter an operational finding id before creating an instance."
        : null;
    case "preflight":
      if (context.selectedStatus === null) {
        return "Select a remediation instance before running preflight.";
      }

      if (context.transitionsBlocked) {
        return "Preflight is blocked until remediation blockers are cleared.";
      }

      return canRunRemediationPreflight(context.selectedStatus)
        ? null
        : "Preflight is available only while the instance is classified.";
    case "approve":
      if (context.selectedStatus === null) {
        return "Select a remediation instance before approving.";
      }

      if (context.transitionsBlocked) {
        return "Approval is blocked until preflight passes.";
      }

      return canApproveRemediationInstance(context.selectedStatus)
        ? null
        : "Approve is available only after preflight passes.";
    case "assignWave":
      if (context.selectedStatus === null) {
        return "Select a remediation instance before assigning a wave.";
      }

      if (context.transitionsBlocked) {
        return "Wave assignment is blocked until remediation blockers are cleared.";
      }

      if (context.selectedWaveId.trim().length === 0) {
        return "Choose a remediation wave before assigning.";
      }

      return canAssignRemediationWave(context.selectedStatus)
        ? null
        : "Wave assignment is available only after approval.";
    case "execute":
      if (context.selectedStatus === null) {
        return "Select a remediation instance before execute.";
      }

      if (context.transitionsBlocked) {
        return "Execute is blocked until remediation blockers are cleared.";
      }

      if (context.selectedSnapshotId.trim().length === 0) {
        return "Choose an inventory snapshot before execute.";
      }

      return canExecuteRemediationInstance(context.selectedStatus)
        ? null
        : "Execute is available only after wave assignment.";
    case "verify":
      if (context.selectedStatus === null) {
        return "Select a remediation instance before verify.";
      }

      if (context.transitionsBlocked) {
        return "Verify is blocked until remediation blockers are cleared.";
      }

      if (context.selectedSnapshotId.trim().length === 0) {
        return "Choose a post-execute inventory snapshot before verify.";
      }

      return canVerifyRemediationInstance(context.selectedStatus)
        ? null
        : "Verify is available only after advisory execute completes.";
    case "close":
      if (context.selectedStatus === null) {
        return "Select a remediation instance before close.";
      }

      return canCloseRemediationInstance(context.selectedStatus)
        ? null
        : "Close is available only after verify completes or fails.";
    default:
      return null;
  }
}

export function remediationLifecycleTransitionsBlocked(
  status: RemediationInstanceStatus | null,
  blockers: readonly string[],
): boolean {
  if (status === null) {
    return false;
  }

  return isRemediationTransitionBlocked(status, blockers);
}
