import Link from "next/link";

import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { Button } from "@/components/ui/button";
import type { AuditEvent } from "@/lib/api";
import { formatAuditSummaryHeading } from "@/app/(operator)/audit/audit-ui-helpers";
import {
  auditExportControlDisabledTitle,
  auditExportCsvButtonLabelRoleRestricted,
  auditExportCsvButtonLabelWindowIncomplete,
  auditExportSampleWorkspaceCsvHintBuyerPolished,
  auditLoadMoreButtonTitleOperator,
  auditLoadMoreButtonTitleReader,
  auditResultsSectionHeadingBuyerPolished,
  auditResultsSectionHeadingOperator,
  auditResultsSectionHeadingReader,
  auditResultsSectionIntroBuyerPolished,
} from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { AuditTimelineEventCard } from "./AuditTimelineEventCard";
import { BuyerAuditEventsTechnicalAppendix } from "./BuyerAuditEventsTechnicalAppendix";

type AuditEventGroup = { stage: string; events: AuditEvent[] };

type AuditResultsSectionProps = {
  buyerPolishedShell: boolean;
  callerAuthorityRank: number;
  events: AuditEvent[];
  displayEvents: AuditEvent[];
  displayEventGroups: AuditEventGroup[] | null;
  hasMoreResults: boolean;
  loadingMore: boolean;
  searching: boolean;
  uniformRunIdForDisplay: string | null;
  auditSearchEmptyLine: string;
  loadMore: () => void | Promise<void>;
  csvExportUiAllowed: boolean;
  exporting: boolean;
  exportDateRangeReady: boolean;
  exportRoleOk: boolean;
  onExportCsv: () => void | Promise<void>;
};

export function AuditResultsSection(props: AuditResultsSectionProps) {
  const {
    buyerPolishedShell,
    callerAuthorityRank,
    events,
    displayEvents,
    displayEventGroups,
    hasMoreResults,
    loadingMore,
    searching,
    uniformRunIdForDisplay,
    auditSearchEmptyLine,
    loadMore,
    csvExportUiAllowed,
    exporting,
    exportDateRangeReady,
    exportRoleOk,
    onExportCsv,
  } = props;

  return (
    <section aria-labelledby="audit-results-heading">
      <h3 id="audit-results-heading" className="mt-0 mb-2 text-base">
        {buyerPolishedShell
          ? auditResultsSectionHeadingBuyerPolished
          : callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
            ? auditResultsSectionHeadingReader
            : auditResultsSectionHeadingOperator}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400 text-[13px] mt-0 mb-2 max-w-2xl">
        {buyerPolishedShell ? (
          <>{auditResultsSectionIntroBuyerPolished}</>
        ) : (
          <>
            Each card is one <GlossaryTooltip termKey="audit_event">audit event</GlossaryTooltip>
            {" — "}
            who acted, what changed, when it happened
            {", and review context when present"}.
            {" "}Expand for technical payloads.
          </>
        )}
      </p>
      {buyerPolishedShell && isNextPublicDemoMode() ? (
        <p className="m-0 mb-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Sample timeline — illustrative dates for walkthrough.
        </p>
      ) : null}
      <p role="status" aria-live="polite" aria-atomic="true" className="text-neutral-600 dark:text-neutral-400 text-sm mt-0">
        {formatAuditSummaryHeading(events.length, hasMoreResults)}.
        {buyerPolishedShell
          ? displayEventGroups !== null
            ? " Showing the full lifecycle from review start through packaged deliverables, grouped by stage."
            : " Showing the full lifecycle from review start through packaged deliverables."
          : " Newest first; use Load more for older entries."}
      </p>
      {buyerPolishedShell && uniformRunIdForDisplay !== null ? (
        <p className="mb-2 mt-1 max-w-2xl text-sm text-neutral-700 dark:text-neutral-300">
          All events in this view belong to{" "}
          <Link
            className="font-medium text-teal-800 underline dark:text-teal-300"
            href={`/reviews/${encodeURIComponent(uniformRunIdForDisplay)}`}
          >
            {buyerFacingReviewLinkLabelFromRunId(uniformRunIdForDisplay)}
          </Link>
          .
        </p>
      ) : null}

      <div className="mt-3">
        {events.length === 0 ? (
          <p className="text-neutral-500 dark:text-neutral-400">{auditSearchEmptyLine}</p>
        ) : (
          <>
            {displayEventGroups !== null ? (
              <div className="space-y-8">
                {displayEventGroups.map((group) => (
                  <div
                    key={group.stage}
                    className="rounded-xl border border-neutral-200/95 bg-neutral-50/50 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/30"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200/90 pb-2 dark:border-neutral-700">
                      <h3 className="m-0 border-l-[3px] border-teal-600/70 pl-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-teal-500/80 dark:text-neutral-400">
                        {group.stage}
                      </h3>
                      <p className="m-0 text-[11px] font-medium tabular-nums text-neutral-500 dark:text-neutral-400">
                        {group.events.length} event{group.events.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-3">
                      {group.events.map((ev) => (
                        <AuditTimelineEventCard
                          key={ev.eventId}
                          ev={ev}
                          buyerPolishedShell={buyerPolishedShell}
                          uniformRunId={uniformRunIdForDisplay}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                {displayEvents.map((ev) => (
                  <AuditTimelineEventCard
                    key={ev.eventId}
                    ev={ev}
                    buyerPolishedShell={buyerPolishedShell}
                    uniformRunId={uniformRunIdForDisplay}
                  />
                ))}
              </div>
            )}
            {events.length > 0 && hasMoreResults ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore || searching}
                  title={
                    callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
                      ? auditLoadMoreButtonTitleReader
                      : auditLoadMoreButtonTitleOperator
                  }
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            ) : null}
            {buyerPolishedShell && events.length > 0 ? (
              <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                {isNextPublicDemoMode() && !csvExportUiAllowed ? (
                  <p
                    className="mb-2 max-w-prose text-xs text-neutral-500 dark:text-neutral-400"
                    data-testid="audit-buyer-sample-csv-hint"
                  >
                    {auditExportSampleWorkspaceCsvHintBuyerPolished}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant={
                    csvExportUiAllowed
                      ? "primary"
                      : isNextPublicDemoMode()
                        ? "secondary"
                        : "outline"
                  }
                  size="sm"
                  onClick={() => void onExportCsv()}
                  disabled={!csvExportUiAllowed || exporting || searching}
                  title={
                    !exportDateRangeReady
                      ? "Set From and To to enable export"
                      : !exportRoleOk
                        ? auditExportControlDisabledTitle
                        : "Download audit trail as CSV using the current filters"
                  }
                >
                  {exporting
                    ? "Exporting…"
                    : csvExportUiAllowed
                      ? "Download audit trail (CSV)"
                      : !exportDateRangeReady
                        ? auditExportCsvButtonLabelWindowIncomplete
                        : !exportRoleOk
                          ? auditExportCsvButtonLabelRoleRestricted
                          : "Download audit trail (CSV)"}
                </Button>
              </div>
            ) : null}
            {buyerPolishedShell ? <BuyerAuditEventsTechnicalAppendix events={displayEvents} /> : null}
          </>
        )}
      </div>
    </section>
  );
}
