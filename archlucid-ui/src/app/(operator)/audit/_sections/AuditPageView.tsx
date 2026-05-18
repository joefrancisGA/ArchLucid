import Link from "next/link";

import { HelpLink } from "@/components/HelpLink";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { AuditLogRankCue } from "@/components/EnterpriseControlsContextHints";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { cn } from "@/lib/utils";
import { auditExportExecuteRankAuditorRoleNote } from "@/lib/enterprise-controls-context-copy";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { AuditBuyerHeaderMetrics } from "./AuditBuyerHeaderMetrics";
import { AuditOperatorExportSection } from "./AuditOperatorExportSection";
import { AuditResultsSection } from "./AuditResultsSection";
import { AuditSearchSection } from "./AuditSearchSection";
import type { AuditPageViewProps } from "./audit-page-view-props";

/** Presentational layout for the operator audit log page. */
export function AuditPageView(props: AuditPageViewProps) {
  const buyerPolishedShell = props.buyerPolishedShell;

  const buyerOmitSearchFiltersChrome =
    buyerPolishedShell &&
    !props.searching &&
    props.displayEvents.length > 0 &&
    props.displayEvents.length <= 10;

  return (
    <div className={buyerPolishedShell ? "max-w-6xl" : "max-w-4xl"}>
      <LayerHeader pageKey="audit" />
      <OperatorPageHeader
        title={
          buyerPolishedShell
            ? `Audit trail for ${buyerFacingReviewLinkLabelFromRunId(
                props.runId.trim().length > 0 ? props.runId.trim() : SHOWCASE_STATIC_DEMO_RUN_ID,
              )}`
            : "Audit log"
        }
        helpKey="audit-log"
        actions={
          <HelpLink
            docPath="/docs/library/AUDIT_COVERAGE_MATRIX.md"
            label="Audit coverage matrix documentation on GitHub (new tab)"
          />
        }
      />
      {buyerPolishedShell ? (
        <AuditBuyerHeaderMetrics
          buyerAuditTrailSummaryLine={props.buyerAuditTrailSummaryLine}
          buyerAuditTrailMetrics={props.buyerAuditTrailMetrics}
        />
      ) : null}

      <AuditLogRankCue className="mb-2" />

      {props.callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority && !props.exportRoleOk && !buyerPolishedShell ? (
        <p className="mb-2 max-w-prose text-xs text-neutral-600 dark:text-neutral-400" role="note">
          {auditExportExecuteRankAuditorRoleNote}
        </p>
      ) : null}

      {props.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={props.failure.problem}
            fallbackMessage={props.failure.message}
            correlationId={props.failure.correlationId}
          />
        </div>
      ) : null}

      <div className={cn(buyerPolishedShell && "flex flex-col")}>
        <div className={cn(buyerPolishedShell && "order-2")}>
          <AuditSearchSection
            buyerPolishedShell={buyerPolishedShell}
            buyerOmitSearchFiltersChrome={buyerOmitSearchFiltersChrome}
            callerAuthorityRank={props.callerAuthorityRank}
            canMutateEnterpriseShell={props.canMutateEnterpriseShell}
            advancedAuditFiltersOpen={props.advancedAuditFiltersOpen}
            setAdvancedAuditFiltersOpen={props.setAdvancedAuditFiltersOpen}
            buyerPrimaryFiltersOpen={props.buyerPrimaryFiltersOpen}
            setBuyerPrimaryFiltersOpen={props.setBuyerPrimaryFiltersOpen}
            eventTypes={props.eventTypes}
            eventType={props.eventType}
            setEventType={props.setEventType}
            fromUtc={props.fromUtc}
            setFromUtc={props.setFromUtc}
            toUtc={props.toUtc}
            setToUtc={props.setToUtc}
            correlationId={props.correlationId}
            setCorrelationId={props.setCorrelationId}
            actorUserId={props.actorUserId}
            setActorUserId={props.setActorUserId}
            runId={props.runId}
            setRunId={props.setRunId}
            searching={props.searching}
            loadingTypes={props.loadingTypes}
            auditDatePreset={props.auditDatePreset}
            applyAuditDatePreset={props.applyAuditDatePreset}
            clearDateRangeAndSearch={props.clearDateRangeAndSearch}
            runSearch={props.runSearch}
            clearFiltersAndSearch={props.clearFiltersAndSearch}
          />
        </div>

        <div className={cn(buyerPolishedShell && "order-1")}>
          <AuditResultsSection
            buyerPolishedShell={buyerPolishedShell}
            callerAuthorityRank={props.callerAuthorityRank}
            events={props.events}
            displayEvents={props.displayEvents}
            displayEventGroups={props.displayEventGroups}
            hasMoreResults={props.hasMoreResults}
            loadingMore={props.loadingMore}
            searching={props.searching}
            uniformRunIdForDisplay={props.uniformRunIdForDisplay}
            auditSearchEmptyLine={props.auditSearchEmptyLine}
            loadMore={props.loadMore}
            csvExportUiAllowed={props.csvExportUiAllowed}
            exporting={props.exporting}
            exportDateRangeReady={props.exportDateRangeReady}
            exportRoleOk={props.exportRoleOk}
            onExportCsv={props.onExportCsv}
          />
        </div>
      </div>

      {props.events.length > 0 && !buyerPolishedShell ? (
        <AuditOperatorExportSection
          csvExportUiAllowed={props.csvExportUiAllowed}
          exporting={props.exporting}
          searching={props.searching}
          exportDateRangeReady={props.exportDateRangeReady}
          exportRoleOk={props.exportRoleOk}
          onExportCsv={props.onExportCsv}
        />
      ) : null}

      {buyerPolishedShell ? (
        <details className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40">
          <summary className="cursor-pointer text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Next steps after sample review
          </summary>
          <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            When your team is ready for tenant-backed governed reviews, procurement and workspace onboarding use a
            separate request flow. You have now seen the sample audit trail — use this section when you are ready to
            discuss tenant-backed workspaces.
          </p>
          <p className="m-0 mt-3 text-sm">
            <Link
              className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
              href="/reviews/new"
            >
              Create follow-up review
            </Link>{" "}
            when you need another governed package after completing this sample path.
          </p>
        </details>
      ) : null}
    </div>
  );
}
