"use client";

import Link from "next/link";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { truncateMiddle } from "@/lib/truncate-middle";
import { cn } from "@/lib/utils";

import {
  formatAgeUtc,
  resolveReviewHref,
  truncateErrorMessage,
  type IntegrationEventOutboxDeadLetterRow,
} from "./integration-events-dlq-presentation";

export type IntegrationEventsDlqTableProps = {
  rows: readonly IntegrationEventOutboxDeadLetterRow[];
  canMutate: boolean;
  retryingId: string | null;
  suppressingId: string | null;
  mutationDisabledHintId: string;
  mutationDisabledReason: string | null;
  onRetry: (outboxId: string) => void;
  onSuppressRequest: (outboxId: string) => void;
  onCopyCurl: (outboxId: string) => void;
};

export function IntegrationEventsDlqTable(props: IntegrationEventsDlqTableProps) {
  const {
    rows,
    canMutate,
    retryingId,
    suppressingId,
    mutationDisabledHintId,
    mutationDisabledReason,
    onRetry,
    onSuppressRequest,
    onCopyCurl,
  } = props;

  return (
    <EnterpriseTable ariaLabel="Failed integration messages">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Tenant</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Event</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Age</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Dead-lettered (UTC)</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Retries</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Last error</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {rows.map((row) => {
          const reviewHref = resolveReviewHref(row.runId);
          const tenantLabel =
            row.tenantId === undefined || row.tenantId === null || row.tenantId === ""
              ? " — "
              : truncateMiddle(row.tenantId, 18);
          const lastError = row.lastErrorMessage ?? " — ";

          return (
            <EnterpriseTableRow key={row.outboxId}>
              <EnterpriseTableCell>
                <span
                  className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}
                  aria-label={row.tenantId ?? undefined}
                >
                  {tenantLabel}
                </span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
                  {row.eventType}
                </span>
              </EnterpriseTableCell>
              <EnterpriseTableCell data-testid={`integration-events-dlq-review-cell-${row.outboxId}`}>
                {reviewHref === null ? (
                  <span className={OPERATOR_TYPOGRAPHY.helper}>—</span>
                ) : (
                  <Link
                    href={reviewHref}
                    className={cn("font-mono underline-offset-2 hover:underline", OPERATOR_TYPOGRAPHY.micro)}
                    aria-label={row.runId ?? undefined}
                  >
                    {truncateMiddle(row.runId ?? "", 18)}
                  </Link>
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={OPERATOR_TYPOGRAPHY.helper}>{formatAgeUtc(row.deadLetteredUtc)}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={OPERATOR_TYPOGRAPHY.helper}>{row.deadLetteredUtc}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={OPERATOR_TYPOGRAPHY.helper}>{row.retryCount}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={OPERATOR_TYPOGRAPHY.helper} aria-label={lastError === " — " ? undefined : lastError}>
                  {truncateErrorMessage(row.lastErrorMessage)}
                </span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={retryingId === row.outboxId || suppressingId === row.outboxId || !canMutate}
                    aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                    onClick={() => {
                      if (row.outboxId === undefined || row.outboxId === null) {
                        return;
                      }

                      onRetry(row.outboxId);
                    }}
                  >
                    {retryingId === row.outboxId ? "Retrying…" : "Retry"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={retryingId === row.outboxId || suppressingId === row.outboxId || !canMutate}
                    aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                    onClick={() => {
                      if (row.outboxId === undefined || row.outboxId === null) {
                        return;
                      }

                      onSuppressRequest(row.outboxId);
                    }}
                  >
                    {suppressingId === row.outboxId ? "Suppressing…" : "Suppress"}
                  </Button>
                  <HelpLazyDetails
                    summary="Advanced"
                    data-testid={`integration-events-dlq-advanced-${row.outboxId}`}
                    bodyTestId={`integration-events-dlq-advanced-body-${row.outboxId}`}
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (row.outboxId === undefined || row.outboxId === null) {
                          return;
                        }

                        onCopyCurl(row.outboxId);
                      }}
                    >
                      Copy as cURL
                    </Button>
                  </HelpLazyDetails>
                </div>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
