import type { ReactNode } from "react";

import Link from "next/link";

import {
  readActiveWorkspaceScopeLabel,
  resolveWorkspaceScopeLabelFromRecord,
} from "@/lib/active-workspace-scope-label";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GovernanceAssignedToMeFetchBasis } from "@/lib/governance/governance-assigned-to-me-fetch-basis";
import {
  GOVERNANCE_ASSIGNED_TO_ME_SEARCH_EXCLUSIONS,
  governanceAssignedToMeFetchBasisLabel,
} from "@/lib/governance/governance-assigned-to-me-fetch-basis";
import {
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_FINDINGS_PATH,
  SECURENOW_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import { operatorLastRefreshedExactLabel } from "@/lib/operator/operator-last-refreshed-label";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

export type GovernanceAssignedToMeEmptyAttestationArgs = {
  readonly assigneeDisplayName: string;
  readonly assigneeRoleLabel?: string | null;
  readonly checkedAt: Date | null;
  readonly fetchBasis?: GovernanceAssignedToMeFetchBasis | null;
  readonly productLine?: "architecture" | "security";
  /** When true, the header already owns freshness — omit the duplicate checked-at line (SEA P1). */
  readonly suppressCheckedAtLine?: boolean;
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

export function formatGovernanceAssignedToMeIdentityAttestation(
  assigneeDisplayName: string,
  assigneeRoleLabel?: string | null,
): string {
  const assignee = resolveGovernanceAssignedToMeAssigneeLabel(assigneeDisplayName);
  const role = assigneeRoleLabel?.trim() ?? "";

  if (role.length > 0) {
    return `${assignee} (${role})`;
  }

  return assignee;
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
      <time
        dateTime={isoUtc}
        aria-label={absoluteLabel}
        className="text-al-text-primary"
      >
        {relativeAge} ({absoluteLabel})
      </time>
    </>
  );
}

export function buildGovernanceAssignedToMeEmptyDescription(
  args: GovernanceAssignedToMeEmptyAttestationArgs,
  options?: { readonly nowMs?: number; readonly headerOwnsFreshness?: boolean },
): ReactNode {
  const identityAttestation = formatGovernanceAssignedToMeIdentityAttestation(
    args.assigneeDisplayName,
    args.assigneeRoleLabel,
  );
  const workspace = readActiveWorkspaceScopeLabel();
  const basis = args.fetchBasis ?? "register-only";
  const showAuditTrail = args.productLine !== "security";
  const suppressCheckedAt =
    args.suppressCheckedAtLine === true || options?.headerOwnsFreshness === true;

  return (
    <div className="max-w-3xl space-y-2">
      <p className="m-0" data-testid="governance-assigned-to-me-empty-scope">
        <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Scope</span>
        No open findings are assigned to{" "}
        <span className="font-medium text-al-text-primary">{identityAttestation}</span> in{" "}
        <span className="font-medium text-al-text-primary">{workspace}</span>.
      </p>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="governance-assigned-to-me-empty-basis"
      >
        <span className="block font-medium text-al-text-primary">Basis</span>
        {governanceAssignedToMeFetchBasisLabel(basis)} {GOVERNANCE_ASSIGNED_TO_ME_SEARCH_EXCLUSIONS}{" "}
        {showAuditTrail ? (
          <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.inline}>
            View audit trail
          </Link>
        ) : null}
      </p>
      {suppressCheckedAt ? null : (
        <p className="m-0" data-testid="governance-assigned-to-me-empty-checked-at">
          <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Freshness</span>
          <GovernanceAssignedToMeCheckedAtLine checkedAt={args.checkedAt} nowMs={options?.nowMs} />
        </p>
      )}
    </div>
  );
}

export function assignedToMeFindingsHref(productLine: "architecture" | "security"): string {
  return productLine === "security" ? SECURENOW_FINDINGS_PATH : GOVERNANCE_FINDINGS_PATH;
}

export const GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL = "Open findings queue";

export const GOVERNANCE_ASSIGNED_TO_ME_LAST_CHECKED_PREFIX = "Last checked" as const;

export const GOVERNANCE_ASSIGNED_TO_ME_REFRESHING_LABEL = "Checking assigned findings…" as const;
