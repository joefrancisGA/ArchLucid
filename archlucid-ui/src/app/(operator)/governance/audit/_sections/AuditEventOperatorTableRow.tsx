"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { CSSProperties, ReactElement } from "react";

import {
  EnterpriseTableCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import type { AuditEvent } from "@/lib/api";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer/buyer-facing-review-title";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { formatUtc, tryFormatDataJson } from "./audit-page-helpers";

export type AuditEventOperatorTableRowProps = {
  readonly event: AuditEvent;
  readonly style?: CSSProperties;
};

/** Single audit log row (virtualized list item in {@link AuditEventsOperatorTable}). */
export function AuditEventOperatorTableRow(props: AuditEventOperatorTableRowProps): ReactElement {
  const { event: ev, style } = props;
  const runId = ev.runId?.trim() ?? "";

  return (
    <EnterpriseTableRow style={style}>
      <EnterpriseTableCell className="whitespace-nowrap tabular-nums">
        <time dateTime={ev.occurredUtc}>{formatUtc(ev.occurredUtc)}</time>
      </EnterpriseTableCell>
      <EnterpriseTableCell>{pipelineEventTypeFriendlyLabel(ev.eventType)}</EnterpriseTableCell>
      <EnterpriseTableCell>
        <span className="font-medium text-al-text-primary">{ev.actorUserName}</span>
        <span className={cn("mt-0.5 block font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          {ev.actorUserId}
        </span>
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        {runId.length > 0 ? (
          <Link className={OPERATOR_LINK.nav} href={`/architecture/reviews/${encodeURIComponent(runId)}`}>
            {buyerFacingReviewLinkLabelFromRunId(runId)}
          </Link>
        ) : (
          <span className="text-al-text-secondary">—</span>
        )}
      </EnterpriseTableCell>
      <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
        {(ev.correlationId ?? "").trim().length > 0 ? (
          <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{ev.correlationId}</span>
        ) : (
          "—"
        )}
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <details>
          <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
            View JSON
          </summary>
          <pre
            className={cn(
              "mt-2 max-h-40 overflow-auto rounded-md border border-neutral-200 bg-al-surface-raised p-2 dark:border-neutral-800",
              OPERATOR_TYPOGRAPHY.micro,
            )}
          >
            {tryFormatDataJson(ev.dataJson)}
          </pre>
        </details>
      </EnterpriseTableCell>
    </EnterpriseTableRow>
  );
}
