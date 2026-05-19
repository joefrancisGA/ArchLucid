import Link from "next/link";

import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { Button } from "@/components/ui/button";
import type { AuditEvent } from "@/lib/api";
import { formatAuditSummaryHeading } from "@/app/(operator)/audit/audit-ui-helpers";
import {
  auditBuyerUtilitiesDetailsSummary,
  auditExportControlDisabledTitle,
  auditExportExecuteRankAuditorRoleNote,
  auditExportCsvButtonLabelRoleRestricted,
  auditExportCsvButtonLabelWindowIncomplete,
  auditExportSampleWorkspaceCsvHintBuyerPolished,
  auditExportSectionSupportingLineBuyerPolished,
  auditLoadMoreButtonTitleOperator,
  auditLoadMoreButtonTitleReader,
  auditResultsSectionHeadingBuyerPolished,
  auditResultsSectionHeadingOperator,
  auditResultsSectionHeadingReader,
  auditResultsSectionIntroBuyerPolished,
} from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import { cn } from "@/lib/utils";
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
        {buyerPolishedShell ? null : " Newest first; use Load more for older entries."}
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
      {buyerPolishedShell && events.length > 0 ? (
        <p
          className="m-0 mb-3 max-w-2xl text-xs text-neutral-600 dark:text-neutral-400"
          data-testid="audit-buyer-actor-legend"
        >
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Named reviewers</span> appear with role
          labels (for example architecture reviewer or approver).{" "}
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Automatically recorded</span> events are
          lifecycle milestones logged by ArchLucid when no named human actor is attached to the row.
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
              <section
                aria-labelledby="audit-buyer-completion-heading"
                className="mt-8 rounded-xl border-2 border-teal-600/60 bg-teal-50/55 p-4 shadow-sm dark:border-teal-500/40 dark:bg-teal-950/30"
                data-testid="audit-buyer-completion-card"
              >
                <h3 id="audit-buyer-completion-heading" className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Review package complete
                </h3>
                <p className="m-0 mt-2 max-w-prose text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                  Decision, signed manifest, evidence trail, governance approval, and audit trail are available for this
                  sample review package.
                </p>
              </section>
            ) : null}
            {buyerPolishedShell && events.length > 0 ? (
              <details
                className="mt-6 border-t border-neutral-200 pt-2 dark:border-neutral-700"
                data-testid="audit-buyer-utilities-details"
              >
                <summary className="cursor-pointer pt-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {auditBuyerUtilitiesDetailsSummary}
                </summary>
                <div className="mt-4 space-y-3 pb-2">
                  <p className="m-0 max-w-prose text-xs text-neutral-600 dark:text-neutral-400">
                    {auditExportSectionSupportingLineBuyerPolished}
                  </p>
                  {!exportRoleOk ? (
                    <p className="m-0 max-w-prose text-xs text-neutral-600 dark:text-neutral-400">
                      {auditExportExecuteRankAuditorRoleNote}
                    </p>
                  ) : null}
                  {isNextPublicDemoMode() && !csvExportUiAllowed ? (
                    <p
                      className="m-0 max-w-prose text-xs text-neutral-600 dark:text-neutral-400"
                      data-testid="audit-buyer-sample-csv-hint"
                    >
                      {auditExportSampleWorkspaceCsvHintBuyerPolished}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant={csvExportUiAllowed ? "primary" : "outline"}
                    size="sm"
                    className={cn(
                      !csvExportUiAllowed &&
                        isNextPublicDemoMode() &&
                        "border-2 border-teal-700/80 text-neutral-900 shadow-sm hover:bg-teal-50 dark:border-teal-500/70 dark:text-neutral-50 dark:hover:bg-teal-950/40",
                      !csvExportUiAllowed && !exporting && "disabled:opacity-80 dark:disabled:opacity-80",
                    )}
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
                  <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
                    <p className="m-0 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Next steps after sample review
                    </p>
                    <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                      When your team is ready for tenant-backed governed reviews, procurement and workspace onboarding use a
                      separate request flow. You have now seen the sample audit trail — use this section when you are ready to
                      discuss tenant-backed workspaces.
                    </p>
                    <p className="m-0 mt-3 text-xs">
                      <Link
                        className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
                        href="/reviews/new"
                      >
                        Create follow-up review
                      </Link>{" "}
                      when you need another governed package after completing this sample path.
                    </p>
                  </div>
                </div>
              </details>
            ) : null}
            {buyerPolishedShell ? <BuyerAuditEventsTechnicalAppendix events={displayEvents} /> : null}
          </>
        )}
      </div>
    </section>
  );
}
