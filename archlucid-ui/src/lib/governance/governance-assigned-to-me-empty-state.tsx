import type { ReactNode } from "react";

import {
  readActiveWorkspaceScopeLabel,
  resolveWorkspaceScopeLabelFromRecord,
} from "@/lib/active-workspace-scope-label";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { operatorLastRefreshedExactLabel } from "@/lib/operator/operator-last-refreshed-label";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { formatRelativeTime } from "@/lib/relative-time";

export type GovernanceAssignedToMeEmptyAttestationArgs = {
  readonly assigneeDisplayName: string;
  readonly checkedAt: Date | null;
};

/** Workspace label for assigned-to-me attestation — same precedence as the scope switcher. */
export function resolveGovernanceAssignedToMeWorkspaceLabel(): string {
  return resolveWorkspaceScopeLabelFromRecord(readOperatorScopeFromStorage());
}

export function formatGovernanceAssignedToMeCheckedAtRelative(
  checkedAt: Date,
  nowMs: number = Date.now(),
): string {
  return formatRelativeTime(checkedAt.toISOString(), nowMs);
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

function GovernanceAssignedToMeCheckedAtLine(props: {
  readonly checkedAt: Date | null;
  readonly nowMs?: number;
}): ReactNode {
  if (props.checkedAt === null) {
    return "Not checked yet";
  }

  const isoUtc = props.checkedAt.toISOString();
  const relativeAge = formatGovernanceAssignedToMeCheckedAtRelative(props.checkedAt, props.nowMs);
  const absoluteLabel = operatorLastRefreshedExactLabel(props.checkedAt) ?? isoUtc;

  return (
    <>
      Checked{" "}
      <time dateTime={isoUtc} title={absoluteLabel} className="text-al-text-primary">
        {relativeAge}
      </time>
    </>
  );
}

export function buildGovernanceAssignedToMeEmptyDescription(
  args: GovernanceAssignedToMeEmptyAttestationArgs,
  options?: { readonly nowMs?: number },
): ReactNode {
  const assignee = resolveGovernanceAssignedToMeAssigneeLabel(args.assigneeDisplayName);
  const workspace = readActiveWorkspaceScopeLabel();

  return (
    <div className="max-w-3xl">
      <p className="m-0">
        No open findings are assigned to <span className="font-medium text-al-text-primary">{assignee}</span> in{" "}
        <span className="font-medium text-al-text-primary">{workspace}</span>.
      </p>
      <p className="m-0 mt-1" data-testid="governance-assigned-to-me-empty-checked-at">
        <GovernanceAssignedToMeCheckedAtLine checkedAt={args.checkedAt} nowMs={options?.nowMs} />
      </p>
    </div>
  );
}

export const GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_HREF = GOVERNANCE_FINDINGS_PATH;

export const GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL = "Open findings queue";
