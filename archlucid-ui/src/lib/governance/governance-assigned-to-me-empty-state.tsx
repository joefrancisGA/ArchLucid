import type { ReactNode } from "react";

import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export type GovernanceAssignedToMeEmptyAttestationArgs = {
  readonly assigneeDisplayName: string;
  readonly workspaceName: string;
  readonly checkedAt: Date | null;
};

export function formatGovernanceAssignedToMeCheckedAt(checkedAt: Date): string {
  const time = checkedAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `Checked ${time}`;
}

export function resolveGovernanceAssignedToMeWorkspaceLabel(
  workspaceLabel: string | null | undefined,
  workspaceId: string | null | undefined,
): string {
  const label = workspaceLabel?.trim() ?? "";

  if (label.length > 0) {
    return label;
  }

  const id = workspaceId?.trim() ?? "";

  if (id.length > 0) {
    return id;
  }

  return "this workspace";
}

export function resolveGovernanceAssignedToMeAssigneeLabel(
  assigneeDisplayName: string | null | undefined,
): string {
  const trimmed = assigneeDisplayName?.trim() ?? "";

  if (trimmed.length > 0) {
    return trimmed;
  }

  return "you";
}

export function buildGovernanceAssignedToMeEmptyDescription(
  args: GovernanceAssignedToMeEmptyAttestationArgs,
): ReactNode {
  const assignee = resolveGovernanceAssignedToMeAssigneeLabel(args.assigneeDisplayName);
  const workspace = resolveGovernanceAssignedToMeWorkspaceLabel(args.workspaceName, null);
  const checkedLine =
    args.checkedAt !== null ? formatGovernanceAssignedToMeCheckedAt(args.checkedAt) : "Not checked yet";

  return (
    <>
      <p className="m-0">
        No open findings are assigned to <span className="font-medium text-al-text-primary">{assignee}</span> in{" "}
        <span className="font-medium text-al-text-primary">{workspace}</span>.
      </p>
      <p className="m-0 mt-1" data-testid="governance-assigned-to-me-empty-checked-at">
        {checkedLine}
      </p>
    </>
  );
}

export const GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_HREF = GOVERNANCE_FINDINGS_PATH;

export const GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL = "Open findings queue";
