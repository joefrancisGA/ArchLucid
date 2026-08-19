import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import type { ReactElement } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type GovernanceApprovalAttestationBlockProps = {
  /** The governance decision value (e.g. "Approved", "ApprovedWithMonitoring", "Rejected"). */
  readonly decision: string;
  /** User ID or display name of the approving operator. */
  readonly approvedByUserId: string | null | undefined;
  /** UTC timestamp of the decision. */
  readonly decisionUtc: string | null | undefined;
  /** Optional free-text rationale recorded at approval time. */
  readonly rationale: string | null | undefined;
  /** Review ID used for the approval hash (first 16 chars shown). */
  readonly runId: string;
};

function formatDecisionLabel(raw: string): string {
  return raw
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function formatUtc(utc: string | null | undefined): string {
  if (!utc) return "—";

  return new Date(utc).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

/**
 * Locked attestation block rendered below a governance approval.
 * Designed to be screenshottable for compliance walkthroughs — mirrors
 * the visual pattern of DocuSign or AdobeSign approval records.
 */
export function GovernanceApprovalAttestationBlock({
  decision,
  approvedByUserId,
  decisionUtc,
  rationale,
  runId,
}: GovernanceApprovalAttestationBlockProps): ReactElement {
  const approvalHash = runId.replace(/-/g, "").slice(0, 12).toUpperCase();

  return (
    <div
      className="rounded-md border border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900"
      data-testid="governance-approval-attestation-block"
    >
      <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
        <Lock className="h-3.5 w-3.5 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden />
        <span className={cn(OPERATOR_NAV_GROUP_LABEL, "text-neutral-600 dark:text-neutral-400")}>
          Governance attestation — {formatDecisionLabel(decision)}
        </span>
      </div>
      <dl className={cn("m-0 grid gap-3 px-4 py-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>
            Decision
          </dt>
          <dd className="mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
            {formatDecisionLabel(decision)}
          </dd>
        </div>
        <div>
          <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>
            Recorded at
          </dt>
          <dd className={cn("mt-0.5 font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.navHelper)}>
            {formatUtc(decisionUtc)}
          </dd>
        </div>
        {approvedByUserId ? (
          <div>
            <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>
              Approver
            </dt>
            <dd className={cn("mt-0.5 font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.navHelper)}>
              {approvedByUserId}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>
            Approval hash
          </dt>
          <dd className={cn("mt-0.5 flex items-center gap-1.5 font-mono text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.navHelper)}>
            <span>{approvalHash}</span>
            <CopyIdButton value={runId} aria-label="Copy full review ID used as approval hash source" />
          </dd>
        </div>
        {rationale ? (
          <div className="sm:col-span-2">
            <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "font-medium text-neutral-500 dark:text-neutral-400")}>
              Rationale
            </dt>
            <dd className="mt-0.5 leading-relaxed text-neutral-700 dark:text-neutral-300">{rationale}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
