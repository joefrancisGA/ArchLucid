"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import type { AuditEvent } from "@/lib/api";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

import { formatUtc, tryFormatDataJson } from "./audit-page-helpers";

export type AuditEventsOperatorTableProps = {
  readonly events: readonly AuditEvent[];
  readonly ariaLabel: string;
};

/** Operator audit log: structured table (TB-117); payload in per-row disclosure. */
export function AuditEventsOperatorTable(props: AuditEventsOperatorTableProps): ReactElement {
  const { events, ariaLabel } = props;

  return (
    <EnterpriseTable ariaLabel={ariaLabel}>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Occurred</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Event</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Actor</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Correlation</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Payload</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {events.map((ev) => {
          const runId = ev.runId?.trim() ?? "";

          return (
            <EnterpriseTableRow key={ev.eventId}>
              <EnterpriseTableCell className="whitespace-nowrap tabular-nums">
                <time dateTime={ev.occurredUtc}>{formatUtc(ev.occurredUtc)}</time>
              </EnterpriseTableCell>
              <EnterpriseTableCell>{pipelineEventTypeFriendlyLabel(ev.eventType)}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className="font-medium text-al-text-primary">{ev.actorUserName}</span>
                <span className="mt-0.5 block font-mono text-xs text-al-text-secondary">{ev.actorUserId}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                {runId.length > 0 ? (
                  <Link
                    className="font-medium text-teal-800 underline dark:text-teal-300"
                    href={`/reviews/${encodeURIComponent(runId)}`}
                  >
                    {buyerFacingReviewLinkLabelFromRunId(runId)}
                  </Link>
                ) : (
                  <span className="text-al-text-secondary">—</span>
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
                {(ev.correlationId ?? "").trim().length > 0 ? (
                  <span className="font-mono text-xs">{ev.correlationId}</span>
                ) : (
                  "—"
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <details>
                  <summary className="cursor-pointer text-xs font-medium text-al-text-primary">View JSON</summary>
                  <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-neutral-200 bg-al-surface-raised p-2 text-xs dark:border-neutral-800">
                    {tryFormatDataJson(ev.dataJson)}
                  </pre>
                </details>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
