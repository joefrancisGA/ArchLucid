import Link from "next/link";

import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { AuditLogRankCue } from "@/components/EnterpriseControlsContextHints";
import { LayerHeader } from "@/components/LayerHeader";
import { auditExportExecuteRankAuditorRoleNote } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  BUYER_CTO_DEMO_AUDIT_DEMO_FILTER_BANNER,
  BUYER_CTO_DEMO_AUDIT_SHOW_ALL_EVENTS_CTA,
} from "@/lib/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  AUDIT_TRAIL_EXPORT_ACTION,
  AUDIT_TRAIL_EXPORTING_ACTION,
  AUDIT_TRAIL_HOW_IT_WORKS_TITLE,
  AUDIT_TRAIL_OPEN_REVIEW_PACKAGE_ACTION,
  AUDIT_TRAIL_PAGE_TITLE,
  AUDIT_TRAIL_TECHNICAL_DETAILS_TITLE,
  auditTrailPageSubtitle,
} from "@/lib/audit-trail-page-copy";
import {
  formatAuditTrailPageTitle,
  isTechnicalAuditRunIdentifier,
} from "@/lib/audit-trail-page-helpers";

import { AuditActiveFilterChips } from "@/components/AuditActiveFilterChips";
import { AuditEvidenceTrailVocabularyRail } from "@/components/AuditEvidenceTrailVocabularyRail";
import { buildAuditActiveFilterChips } from "@/lib/audit-active-filter-chips";
import { CtoDemoAuditIntegrityExportButton } from "@/components/cto-demo/CtoDemoAuditIntegrityExportButton";
import { CtoDemoAuditIntegrityVerifyButton } from "@/components/cto-demo/CtoDemoAuditIntegrityVerifyButton";

import { AuditTrailIntegrityNote } from "@/components/audit/AuditTrailIntegrityNote";
import { AuditBuyerHeaderMetrics } from "./AuditBuyerHeaderMetrics";
import { AuditOperatorExportSection } from "./AuditOperatorExportSection";
import { AuditPageHeader } from "./AuditPageHeader";
import { AuditResultsSection } from "./AuditResultsSection";
import { AuditSearchSection } from "./AuditSearchSection";
import type { AuditPageViewProps } from "./audit-page-view-props";

/** Presentational layout for the operator audit log page. */
export function AuditPageView(props: AuditPageViewProps) {
  const buyerPolishedShell = props.buyerPolishedShell;
  const effectiveRunId =
    props.runId.trim().length > 0 ? props.runId.trim() : SHOWCASE_STATIC_DEMO_RUN_ID;
  const reviewPackageHref = `/architecture/reviews/${encodeURIComponent(effectiveRunId)}`;

  const buyerOmitSearchFiltersChrome =
    buyerPolishedShell &&
    !props.searching &&
    props.displayEvents.length > 0 &&
    props.displayEvents.length <= 10;

  const buyerCompactFilters = buyerPolishedShell && props.displayEvents.length === 0 && !props.searching;

  return (
    <div className={cn(OPERATOR_LAYOUT.sectionStack, buyerPolishedShell ? "max-w-6xl" : "max-w-4xl")}>
      <LayerHeader
        pageKey="audit"
        density={buyerPolishedShell ? "compact" : "default"}
        collapsibleGuidance={buyerPolishedShell ? AUDIT_TRAIL_HOW_IT_WORKS_TITLE : undefined}
      />
      <AuditPageHeader
        title={buyerPolishedShell ? formatAuditTrailPageTitle(props.runId) : AUDIT_TRAIL_PAGE_TITLE}
        subtitle={auditTrailPageSubtitle(buyerPolishedShell)}
        searching={props.searching}
        lastRefreshedAt={props.lastRefreshedAt}
        onRefresh={() => {
          void props.runSearch();
        }}
        metadata={
          buyerPolishedShell && isTechnicalAuditRunIdentifier(effectiveRunId) ? (
            <details data-testid="audit-page-technical-details">
              <summary className={cn("cursor-pointer", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                {AUDIT_TRAIL_TECHNICAL_DETAILS_TITLE}
              </summary>
              <span className={cn("mt-1 block", OPERATOR_TYPOGRAPHY.helper)}>
                Review id: <code>{effectiveRunId}</code>
              </span>
            </details>
          ) : null
        }
        actions={
          buyerPolishedShell ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!props.csvExportUiAllowed || props.exporting || props.searching}
                onClick={() => void props.onExportCsv()}
                data-testid="audit-header-export-button"
              >
                {props.exporting ? AUDIT_TRAIL_EXPORTING_ACTION : AUDIT_TRAIL_EXPORT_ACTION}
              </Button>
              <Button type="button" variant="outline" size="sm" asChild data-testid="audit-header-open-review-button">
                <Link href={reviewPackageHref}>{AUDIT_TRAIL_OPEN_REVIEW_PACKAGE_ACTION}</Link>
              </Button>
              <CtoDemoAuditIntegrityExportButton />
              <CtoDemoAuditIntegrityVerifyButton />
            </>
          ) : (
            <>
              <CtoDemoAuditIntegrityExportButton />
              <CtoDemoAuditIntegrityVerifyButton />
            </>
          )
        }
      />
      <AuditEvidenceTrailVocabularyRail currentSurfaceId="audit" />
{buyerPolishedShell && props.buyerAuditTrailMetrics !== null ? (
        <AuditBuyerHeaderMetrics buyerAuditTrailMetrics={props.buyerAuditTrailMetrics} />
      ) : null}

      {!buyerPolishedShell ? <AuditTrailIntegrityNote /> : null}

      {props.ctoDemoAuditFilterActive ? (
        <div
          role="status"
          data-testid="cto-demo-audit-filter-banner"
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-md border border-teal-200/70 bg-teal-50/80 px-3 py-2 text-teal-950 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          <p className="m-0">{BUYER_CTO_DEMO_AUDIT_DEMO_FILTER_BANNER}</p>
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={props.onClearCtoDemoAuditFilter}>
            {BUYER_CTO_DEMO_AUDIT_SHOW_ALL_EVENTS_CTA}
          </Button>
        </div>
      ) : null}

      <AuditLogRankCue className="mb-2" />

      {props.callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority && !props.exportRoleOk && !buyerPolishedShell ? (
        <p className={cn("mb-2 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="note">
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
            buyerCompactFilters={buyerCompactFilters}
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
          <AuditActiveFilterChips
            chips={buildAuditActiveFilterChips({
              eventType: props.eventType,
              fromUtc: props.fromUtc,
              toUtc: props.toUtc,
              correlationId: props.correlationId,
              actorUserId: props.actorUserId,
              runId: props.runId,
              auditDatePreset: props.auditDatePreset,
            })}
            onClearChip={(id) => {
              if (id === "eventType") props.setEventType("");
              if (id === "datePreset") void props.clearDateRangeAndSearch();
              if (id === "fromUtc") props.setFromUtc("");
              if (id === "toUtc") props.setToUtc("");
              if (id === "correlationId") props.setCorrelationId("");
              if (id === "actorUserId") props.setActorUserId("");
              if (id === "runId") props.setRunId("");
            }}
            onClearAll={() => {
              void props.clearFiltersAndSearch();
            }}
          />
        </div>

        <div className={cn(buyerPolishedShell && "order-1")}>
          <AuditResultsSection
            buyerPolishedShell={buyerPolishedShell}
            viewMode={props.viewMode}
            onViewModeChange={props.onViewModeChange}
            callerAuthorityRank={props.callerAuthorityRank}
            events={props.events}
            displayEvents={props.displayEvents}
            displayEventGroups={props.displayEventGroups}
            hasMoreResults={props.hasMoreResults}
            loadingMore={props.loadingMore}
            searching={props.searching}
            uniformRunIdForDisplay={props.uniformRunIdForDisplay}
            auditSearchEmptyLine={props.auditSearchEmptyLine}
            reviewPackageHref={reviewPackageHref}
            onClearFilters={() => {
              void props.clearFiltersAndSearch();
            }}
            onChooseAnotherReview={() => {
              props.setBuyerPrimaryFiltersOpen(true);
            }}
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
