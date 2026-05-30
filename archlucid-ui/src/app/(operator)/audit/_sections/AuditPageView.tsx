import { InAppHelpLink } from "@/components/InAppHelpLink";
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
          <InAppHelpLink helpSlug="audit-trail" label="Audit coverage matrix documentation" />
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
            showSavedViews={!buyerPolishedShell && props.canMutateEnterpriseShell}
            getAuditSavedViewPayload={props.getAuditSavedViewPayload}
            loadAuditSavedView={props.loadAuditSavedView}
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

    </div>
  );
}
