import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CheckCircle2, Circle } from "lucide-react";
import type { ReactNode } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PipelineTimelineEventTechnicalDisclosure } from "@/components/runs/PipelineTimelineEventTechnicalDisclosure";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { formatElapsedSincePreviousPrefix } from "@/lib/format-elapsed-compact";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import {
  mapTimelineEventToStatusKind,
  timelineEventStatusLabel,
} from "@/lib/map-timeline-event-status";
import { isTimelineMilestoneEvent } from "@/lib/timeline-milestone-events";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import type { PipelineTimelineItem } from "@/types/authority";

const ELAPSED_DELTA_INLINE_THRESHOLD_SEC = 2;

type AuthorityPipelineTimelineProps = {
  items: PipelineTimelineItem[] | null;
  /** When set, show a short operator-facing message instead of the table. */
  loadErrorMessage?: string | null;
  /** When true, omit per-event technical `<details>` (event id / raw type) — public marketing surfaces. */
  omitEventTechnicalDetails?: boolean;
  /** When set, render at most this many rows (keeps the most recent events). */
  maxVisibleItems?: number;
};

function timelineStatusIcon(eventType: string): ReactNode {
  if (isTimelineMilestoneEvent(eventType)) {
    return (
      <CheckCircle2
        className="size-4 shrink-0 text-neutral-600 dark:text-neutral-400"
        aria-hidden
      />
    );
  }

  return (
    <Circle className="size-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden />
  );
}

function actorLabel(name: string): string {
  const n = name.trim();

  if (n.length === 0) {
    return "Actor unknown";
  }

  if (n.toLowerCase() === "system") {
    return "System";
  }

  return n;
}

function formatElapsedSincePreviousInline(prevIso: string | undefined, curIso: string): string | null {
  if (!prevIso) {
    return null;
  }

  const prevMs = Date.parse(prevIso);
  const curMs = Date.parse(curIso);

  if (!Number.isFinite(prevMs) || !Number.isFinite(curMs) || curMs < prevMs) {
    return null;
  }

  const sec = Math.round((curMs - prevMs) / 1000);

  if (sec < ELAPSED_DELTA_INLINE_THRESHOLD_SEC) {
    return null;
  }

  return formatElapsedSincePreviousPrefix(sec);
}

function renderTechnicalDetails(row: PipelineTimelineItem, eventLabel: string): ReactNode {
  return <PipelineTimelineEventTechnicalDisclosure row={row} eventLabel={eventLabel} />;
}

/** Read-only audit trail table for one architecture review (newest first). */
export function AuthorityPipelineTimeline({
  items,
  loadErrorMessage,
  omitEventTechnicalDetails = false,
  maxVisibleItems,
}: AuthorityPipelineTimelineProps) {
  const auditTrailLabel = BUYER_SURFACE_VOCABULARY.auditTrail;

  if (loadErrorMessage) {
    return (
      <p className={cn("mt-0 text-amber-700 dark:text-amber-400", OPERATOR_TYPOGRAPHY.body)}>
        {auditTrailLabel} could not be loaded: {loadErrorMessage}
      </p>
    );
  }

  if (items === null) {
    return (
      <p className={cn("mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {auditTrailLabel} not loaded.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className={cn("mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        No events recorded yet for this review.
      </p>
    );
  }

  const visibleChronologicalItems =
    maxVisibleItems !== undefined && maxVisibleItems > 0 && items.length > maxVisibleItems
      ? items.slice(-maxVisibleItems)
      : items;

  const visibleItems = [...visibleChronologicalItems].reverse();

  return (
    <EnterpriseTable ariaLabel={auditTrailLabel}>
      <EnterpriseTableHead>
        <EnterpriseTableRow>
          <EnterpriseTableHeaderCell>Event</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Timestamp (UTC)</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Actor</EnterpriseTableHeaderCell>
          {omitEventTechnicalDetails ? null : (
            <EnterpriseTableHeaderCell>
              <span className="sr-only">Technical details</span>
            </EnterpriseTableHeaderCell>
          )}
        </EnterpriseTableRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {visibleItems.map((row) => {
          const globalIndex = items.indexOf(row);
          const prevUtc = globalIndex > 0 ? items[globalIndex - 1]!.occurredUtc : undefined;
          const elapsedInline = formatElapsedSincePreviousInline(prevUtc, row.occurredUtc);
          const eventLabel = pipelineEventTypeFriendlyLabel(row.eventType);
          const timestampLabel = formatIsoUtcForDisplay(row.occurredUtc);

          return (
            <EnterpriseTableRow key={row.eventId}>
              <EnterpriseTableCell>
                <span className="inline-flex min-w-0 items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
                  {timelineStatusIcon(row.eventType)}
                  <span>{eventLabel}</span>
                </span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag
                  kind={mapTimelineEventToStatusKind(row.eventType)}
                  label={timelineEventStatusLabel(row.eventType)}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <time
                  className={cn(
                    "tabular-nums text-neutral-600 dark:text-neutral-400",
                    OPERATOR_TYPOGRAPHY.helper,
                  )}
                  dateTime={row.occurredUtc}
                >
                  {timestampLabel}
                  {elapsedInline ? (
                    <span className="ml-1 text-neutral-500 dark:text-neutral-500">{elapsedInline}</span>
                  ) : null}
                </time>
              </EnterpriseTableCell>
              <EnterpriseTableCell className={OPERATOR_TYPOGRAPHY.body}>
                <span className="sr-only">Actor: </span>
                {actorLabel(row.actorUserName)}
              </EnterpriseTableCell>
              {omitEventTechnicalDetails ? null : (
                <EnterpriseTableCell>{renderTechnicalDetails(row, eventLabel)}</EnterpriseTableCell>
              )}
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
