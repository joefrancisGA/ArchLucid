"use client";
import { cn } from "@/lib/utils";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { buildCanonicalObjectSecondaryView } from "@/lib/canonical-object-home-registry";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { formatInstantForBuyerGovernance } from "@/lib/locale-datetime";
import { formatRelativeTime } from "@/lib/relative-time";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

export type GovernanceApprovalInspectorPreviewProps = {
  request: GovernanceApprovalRequest;
};

/** One-line title for tables and inspector chrome (environments only — no invented fields). */
export function approvalRequestPrimaryLabel(row: GovernanceApprovalRequest): string {
  return `${row.sourceEnvironment} → ${row.targetEnvironment}`;
}

/**
 * Read-only approval request summary for the governance dashboard inspector (dashboard payload only).
 */
export function GovernanceApprovalInspectorPreview({ request }: GovernanceApprovalInspectorPreviewProps) {
  const approvalSecondaryViewPresentation = buildCanonicalObjectSecondaryView(
    "approvalRequest",
    "governanceApprovalInspector",
    { approvalRequestId: request.approvalRequestId, runId: request.runId },
  );
  const requestedLabel = formatInstantForBuyerGovernance(request.requestedUtc);
  const reviewedUtcRaw = request.reviewedUtc;
  const reviewedLabel =
    reviewedUtcRaw !== null && reviewedUtcRaw.length > 0 ? formatInstantForBuyerGovernance(reviewedUtcRaw) : null;

  return (
    <div
      className={cn("space-y-4 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
      data-testid="governance-approval-inspector-preview"
    >
      <CanonicalObjectSecondaryViewStrip
        presentation={approvalSecondaryViewPresentation}
        testId="governance-approval-inspector-secondary-view-strip"
      />
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={request.status} domain="governance" ariaLabel={`Governance status: ${request.status}`} />
      </div>

      <dl className="m-0 grid gap-2 sm:grid-cols-[minmax(5rem,auto)_1fr] sm:gap-x-3">
        <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Review ID
        </dt>
        <dd className="m-0 min-w-0">
          <Link
            href={`/architecture/reviews/${encodeURIComponent(request.runId)}`}
            className={cn("break-all font-mono font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper)}
          >
            {request.runId}
          </Link>
        </dd>
        <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Manifest
        </dt>
        <dd className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.helper)}>{request.manifestVersion}</dd>
        <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Requested
        </dt>
        <dd className="m-0" title={requestedLabel}>
          <span className="block">{formatRelativeTime(request.requestedUtc)}</span>
          <span className={cn("mt-0.5 block text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{requestedLabel}</span>
        </dd>
        <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Requested by
        </dt>
        <dd className="m-0">{request.requestedBy}</dd>
        {reviewedLabel !== null && reviewedUtcRaw !== null ? (
          <>
            <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Reviewed
            </dt>
            <dd className="m-0" title={reviewedLabel}>
              <span className="block">{formatRelativeTime(reviewedUtcRaw)}</span>
              <span className={cn("mt-0.5 block text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{reviewedLabel}</span>
            </dd>
          </>
        ) : null}
        {request.reviewedBy !== null && request.reviewedBy.length > 0 ? (
          <>
            <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Reviewed by
            </dt>
            <dd className="m-0">{request.reviewedBy}</dd>
          </>
        ) : null}
        {request.requestComment !== null && request.requestComment.trim().length > 0 ? (
          <>
            <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Request comment
            </dt>
            <dd className="m-0 whitespace-pre-wrap">{request.requestComment}</dd>
          </>
        ) : null}
        {request.reviewComment !== null && request.reviewComment.trim().length > 0 ? (
          <>
            <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Review comment
            </dt>
            <dd className="m-0 whitespace-pre-wrap">{request.reviewComment}</dd>
          </>
        ) : null}
      </dl>

      <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <Button size="sm" variant="outline" className={CTA_WIDTH.content} asChild>
          <Link href={`/governance/approval-requests/${encodeURIComponent(request.approvalRequestId)}/lineage`}>
            Open lineage
          </Link>
        </Button>
      </div>
    </div>
  );
}
