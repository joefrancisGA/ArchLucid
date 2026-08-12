import { cn } from "@/lib/utils";
import Link from "next/link";

import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import type { AuditEvent } from "@/lib/api";
import { formatAuditSummaryHeading } from "@/app/(operator)/governance/audit/audit-ui-helpers";
import { formatBuyerAuditResultsStatusLine } from "@/lib/audit-trail-page-helpers";
import {
  AUDIT_TRAIL_VIEW_STORY_INTRO,
  AUDIT_TRAIL_VIEW_TABLE_INTRO,
  type AuditTrailViewMode,
} from "@/lib/audit-trail-view-mode";
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
} from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer/buyer-facing-review-title";
import {
  BUYER_AUDIT_DOWNLOAD_CTA,
  BUYER_AUDIT_ENTERPRISE_WORKSPACE_FOLLOWUP,
  BUYER_AUDIT_ENTERPRISE_WORKSPACE_LEAD,
  BUYER_AUDIT_PACKAGE_READY_LEAD,
  BUYER_AUDIT_TRAIL_COMPLETE_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { getShowcaseExecutiveHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { AuditBuyerEmptyState } from "./AuditBuyerEmptyState";
import { AuditEventsOperatorTable } from "./AuditEventsOperatorTable";
import { AuditTimelineEventCard } from "./AuditTimelineEventCard";
import { AuditTrailViewSwitcher } from "./AuditTrailViewSwitcher";
import { BuyerAuditEventsTechnicalAppendix } from "./BuyerAuditEventsTechnicalAppendix";
import { CtoDemoAuditClosingBeat } from "@/components/cto-demo/CtoDemoAuditClosingBeat";
import { CtoDemoBuyerValueStrip } from "@/components/cto-demo/CtoDemoBuyerValueStrip";
import { DESIGN_TOKENS, OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  whyDisabledNeedsLifecycle,
  whyDisabledNeedsRole,
  type WhyDisabledCtaReason,
} from "@/lib/why-disabled-cta";

type AuditEventGroup = { stage: string; events: AuditEvent[] };

type AuditResultsSectionProps = {
  buyerPolishedShell: boolean;
  viewMode: AuditTrailViewMode;
  onViewModeChange: (mode: AuditTrailViewMode) => void;
  callerAuthorityRank: number;
  events: AuditEvent[];
  displayEvents: AuditEvent[];
  displayEventGroups: AuditEventGroup[] | null;
  hasMoreResults: boolean;
  loadingMore: boolean;
  searching: boolean;
  uniformRunIdForDisplay: string | null;
  auditSearchEmptyLine: string;
  reviewPackageHref: string;
  onClearFilters: () => void;
  onChooseAnotherReview: () => void;
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
    viewMode,
    onViewModeChange,
    callerAuthorityRank,
    events,
    displayEvents,
    displayEventGroups,
    hasMoreResults,
    loadingMore,
    searching,
    uniformRunIdForDisplay,
    auditSearchEmptyLine,
    reviewPackageHref,
    onClearFilters,
    onChooseAnotherReview,
    loadMore,
    csvExportUiAllowed,
    exporting,
    exportDateRangeReady,
    exportRoleOk,
    onExportCsv,
  } = props;

  const storyPresentation = viewMode === "story";

  const completionExportDisabledReason: WhyDisabledCtaReason | null = (() => {
    if (csvExportUiAllowed || exporting) {
      return null;
    }

    if (!exportDateRangeReady) {
      return whyDisabledNeedsLifecycle("the From and To date range");
    }

    if (!exportRoleOk) {
      return whyDisabledNeedsRole("Execute authority (or auditor export role)");
    }

    return null;
  })();

  return (
    <section aria-labelledby="audit-results-heading">
      <CtoDemoBuyerValueStrip stepIndex={4} />
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <h3 id="audit-results-heading" className={cn("mt-0 mb-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {buyerPolishedShell && events.length > 0
            ? BUYER_AUDIT_TRAIL_COMPLETE_HEADING
            : buyerPolishedShell
              ? auditResultsSectionHeadingBuyerPolished
              : callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
                ? auditResultsSectionHeadingReader
                : auditResultsSectionHeadingOperator}
        </h3>
        <AuditTrailViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>
      <p className={cn("mb-2 mt-0 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {storyPresentation ? (
          <>{AUDIT_TRAIL_VIEW_STORY_INTRO}</>
        ) : buyerPolishedShell ? (
          <>{AUDIT_TRAIL_VIEW_TABLE_INTRO}</>
        ) : (
          <>
            Each row is one <GlossaryTooltip termKey="audit_event">audit event</GlossaryTooltip>
            {" — "}
            who acted, what changed, when it happened
            {", and review context when present"}.
            {" "}Expand for technical payloads.
          </>
        )}
      </p>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="audit-search-summary"
        className={cn("mt-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
      >
        {buyerPolishedShell
          ? formatBuyerAuditResultsStatusLine(events.length, hasMoreResults, searching)
          : `${formatAuditSummaryHeading(events.length, hasMoreResults)}.${" Newest first; use Load more for older entries."}`}
      </p>
      {buyerPolishedShell && uniformRunIdForDisplay !== null ? (
        <p className={cn("mb-2 mt-1 max-w-2xl text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          All events in this view belong to{" "}
          <Link className={OPERATOR_LINK.nav} href={`/architecture/reviews/${encodeURIComponent(uniformRunIdForDisplay)}`}>
            {buyerFacingReviewLinkLabelFromRunId(uniformRunIdForDisplay)}
          </Link>
          .
        </p>
      ) : null}
      

      <div className="mt-3">
        {events.length === 0 ? (
          buyerPolishedShell ? (
            <AuditBuyerEmptyState
              reviewPackageHref={reviewPackageHref}
              onClearFilters={onClearFilters}
              onChooseAnotherReview={onChooseAnotherReview}
              clearingFilters={searching}
            />
          ) : (
            <p
              className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="audit-search-no-results"
            >
              {auditSearchEmptyLine}
            </p>
          )
        ) : (
          <>
            {displayEventGroups !== null ? (
              <div className="space-y-4">
                {displayEventGroups.map((group) => (
                  <div key={group.stage} className={cn(DESIGN_TOKENS.surface.card, "p-4 shadow-sm")}>
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
                      <h3
                        className={cn(
                          "m-0 border-l-2 border-l-[var(--al-accent-interactive)] pl-2.5",
                          OPERATOR_NAV_GROUP_LABEL,
                        )}
                      >
                        {group.stage}
                      </h3>
                      <p className={cn("m-0 font-medium tabular-nums text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                        {group.events.length} event{group.events.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    {storyPresentation ? (
                      <div className="relative pl-5">
                        <div
                          className="pointer-events-none absolute left-1.5 top-2 bottom-2 w-0.5 rounded-full bg-neutral-300 dark:bg-neutral-700"
                          aria-hidden="true"
                        />
                        <div className="grid gap-2">
                          {group.events.map((ev) => (
                            <AuditTimelineEventCard
                              key={ev.eventId}
                              ev={ev}
                              buyerPolishedShell={true}
                              uniformRunId={uniformRunIdForDisplay}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <AuditEventsOperatorTable
                        events={group.events}
                        ariaLabel={`Audit events — ${group.stage}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : storyPresentation ? (
              <div className="grid gap-3">
                {displayEvents.map((ev) => (
                  <AuditTimelineEventCard
                    key={ev.eventId}
                    ev={ev}
                    buyerPolishedShell={true}
                    uniformRunId={uniformRunIdForDisplay}
                  />
                ))}
              </div>
            ) : (
              <AuditEventsOperatorTable events={displayEvents} ariaLabel="Audit log search results" />
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
                className="mt-4 rounded-md border border-neutral-200 bg-al-surface-raised p-4 shadow-sm dark:border-neutral-800"
                data-testid="audit-buyer-completion-card"
              >
                <h3 id="audit-buyer-completion-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {BUYER_AUDIT_TRAIL_COMPLETE_HEADING}
                </h3>
                <p className={cn("m-0 mt-2 max-w-prose leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {BUYER_AUDIT_PACKAGE_READY_LEAD} Download the audit trail or open the review bundle for diligence
                  export.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => void onExportCsv()}
                    disabled={!csvExportUiAllowed || exporting}
                    data-testid="audit-buyer-completion-download"
                  >
                    {BUYER_AUDIT_DOWNLOAD_CTA}
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link href={getShowcaseExecutiveHref()}>Return to executive summary</Link>
                  </Button>
                </div>
                <WhyDisabledCtaHint
                  reason={completionExportDisabledReason}
                  className="mt-2 max-w-prose"
                  testId="audit-buyer-completion-download-disabled-hint"
                />
              </section>
            ) : null}
            {buyerPolishedShell && events.length > 0 ? (
              <details
                className="mt-4 border-t border-neutral-200 pt-2 dark:border-neutral-700"
                data-testid="audit-buyer-utilities-details"
              >
                <summary className={cn("cursor-pointer pt-2 text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                  {auditBuyerUtilitiesDetailsSummary}
                </summary>
                <div className="mt-4 space-y-3 pb-2">
                  <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {auditExportSectionSupportingLineBuyerPolished}
                  </p>
                  {!exportRoleOk ? (
                    <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {auditExportExecuteRankAuditorRoleNote}
                    </p>
                  ) : null}
                  {isNextPublicDemoMode() && !csvExportUiAllowed ? (
                    <p
                      className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
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
                        "border-2 border-neutral-400 text-neutral-900 shadow-sm hover:bg-[var(--al-layer-hover)] dark:border-neutral-600 dark:text-neutral-50 dark:hover:bg-neutral-800/80",
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
                  {buyerPolishedShell ? null : (
                    <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
                      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                        Next steps for enterprise workspace
                      </p>
                      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {BUYER_AUDIT_ENTERPRISE_WORKSPACE_LEAD}{" "}
                        {BUYER_AUDIT_ENTERPRISE_WORKSPACE_FOLLOWUP}
                      </p>
                      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
                        <Link className={OPERATOR_LINK.nav} href="/architecture/reviews/new">
                          Create follow-up review
                        </Link>{" "}
                        when you need another governed package after completing this sample path.
                      </p>
                    </div>
                  )}
                </div>
              </details>
            ) : null}
            {buyerPolishedShell ? <BuyerAuditEventsTechnicalAppendix events={displayEvents} /> : null}
            {buyerPolishedShell && events.length > 0 ? <CtoDemoAuditClosingBeat /> : null}
          </>
        )}
      </div>
    </section>
  );
}
