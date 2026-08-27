import Link from "next/link";

import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorRelatedSurfacesDisclosure } from "@/components/operator/OperatorRelatedSurfacesDisclosure";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { AuditLogRankCue } from "@/components/EnterpriseControlsContextHints";
import { LayerHeader } from "@/components/LayerHeader";
import { auditExportExecuteRankAuditorRoleNote } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_AUDIT_LOAD_ERROR,
  GOVERNANCE_AUDIT_LOAD_ERROR_RETRY_LABEL,
  GOVERNANCE_AUDIT_PRIMARY_CONTENT_ID,
  GOVERNANCE_AUDIT_SKIP_LINK_LABEL,
} from "@/lib/governance-audit-page-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  BUYER_CTO_DEMO_AUDIT_DEMO_FILTER_BANNER,
  BUYER_CTO_DEMO_AUDIT_SHOW_ALL_EVENTS_CTA,
} from "@/lib/buyer/buyer-polish-copy";
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
import { PackageActivityAuditTrailVocabularyRail } from "@/components/PackageActivityAuditTrailVocabularyRail";
import { ReportProblemAuditVocabularyRail } from "@/components/ReportProblemAuditVocabularyRail";
import { buildAuditActiveFilterChips } from "@/lib/audit-active-filter-chips";
import { CtoDemoAuditIntegrityExportButton } from "@/components/cto-demo/CtoDemoAuditIntegrityExportButton";
import { CtoDemoAuditIntegrityVerifyButton } from "@/components/cto-demo/CtoDemoAuditIntegrityVerifyButton";

import { AuditTrailIntegrityNote } from "@/components/audit/AuditTrailIntegrityNote";
import { AuditBuyerHeaderMetrics } from "./AuditBuyerHeaderMetrics";
import { AuditOperatorExportSection } from "./AuditOperatorExportSection";
import { AuditPageBreadcrumb } from "./AuditPageBreadcrumb";
import { AuditPageBuyerChrome } from "./AuditPageBuyerChrome";
import { AuditPageHeader } from "./AuditPageHeader";
import { AuditResultsSection } from "./AuditResultsSection";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { AuditPickReviewBeforeSearchStrip } from "./AuditPickReviewBeforeSearchStrip";
import { AuditNextReviewFooterClient } from "./AuditNextReviewFooterClient";
import { AuditSaveViewCoach } from "./AuditSaveViewCoach";
import { AuditSearchSection } from "./AuditSearchSection";
import type { AuditPageViewProps } from "./audit-page-view-props";
import {
  resolveAuditSearchEmphasizedStepId,
  resolveAuditSearchSteps,
} from "@/lib/audit-search-checklist";

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
  const scopedRunId = props.runId.trim();
  const auditClearScopeHref = GOVERNANCE_AUDIT_PATH;
  const auditFiltersBeyondRunId =
    props.eventType.trim().length > 0 ||
    props.actorUserId.trim().length > 0 ||
    props.correlationId.trim().length > 0 ||
    props.fromUtc.trim().length > 0 ||
    props.toUtc.trim().length > 0;
  const auditSearchSteps = resolveAuditSearchSteps({
    reviewPicked: props.runId.trim().length > 0,
    filtersConfigured: auditFiltersBeyondRunId,
    searchComplete: props.lastRefreshedAt !== null && !props.searching,
  });
  const auditSearchEmphasizedStepId = resolveAuditSearchEmphasizedStepId({
    reviewPicked: props.runId.trim().length > 0,
    filtersConfigured: auditFiltersBeyondRunId,
    searchComplete: props.lastRefreshedAt !== null && !props.searching,
  });

  return (
    <OperatorPageContainer
      variant={buyerPolishedShell ? "workflow" : "dashboard"}
      className={OPERATOR_LAYOUT.sectionStack}
    >
      {buyerPolishedShell ? (
        <a
          href={`#${GOVERNANCE_AUDIT_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {GOVERNANCE_AUDIT_SKIP_LINK_LABEL}
        </a>
      ) : null}

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
        breadcrumb={buyerPolishedShell ? <AuditPageBreadcrumb /> : undefined}
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
              <CtoDemoAuditIntegrityExportButton />
              <CtoDemoAuditIntegrityVerifyButton />
            </>
          )
        }
      />

      {buyerPolishedShell ? <AuditPageBuyerChrome /> : null}

      {!buyerPolishedShell ? (
        <OperatorRelatedSurfacesDisclosure testId="audit-related-surfaces-disclosure">
          <AuditEvidenceTrailVocabularyRail currentSurfaceId="audit" />
          <PackageActivityAuditTrailVocabularyRail currentSurfaceId="audit-trail" />
          <ReportProblemAuditVocabularyRail currentSurfaceId="audit" />
        </OperatorRelatedSurfacesDisclosure>
      ) : null}

      <div
        id={buyerPolishedShell ? GOVERNANCE_AUDIT_PRIMARY_CONTENT_ID : undefined}
        className={cn(buyerPolishedShell ? "scroll-mt-24" : undefined, OPERATOR_LAYOUT.sectionStack)}
        data-testid={buyerPolishedShell ? "governance-audit-primary-content" : undefined}
      >
      {buyerPolishedShell && props.buyerAuditTrailMetrics !== null ? (
        <AuditBuyerHeaderMetrics buyerAuditTrailMetrics={props.buyerAuditTrailMetrics} />
      ) : null}

      {!buyerPolishedShell ? <AuditTrailIntegrityNote /> : null}

      {props.ctoDemoAuditFilterActive ? (
        <div
          role="status"
          data-testid="cto-demo-audit-filter-banner"
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          <p className="m-0">{BUYER_CTO_DEMO_AUDIT_DEMO_FILTER_BANNER}</p>
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={props.onClearCtoDemoAuditFilter}>
            {BUYER_CTO_DEMO_AUDIT_SHOW_ALL_EVENTS_CTA}
          </Button>
        </div>
      ) : null}

      {buyerPolishedShell ? null : <AuditLogRankCue className="mb-2" />}

      {props.callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority && !props.exportRoleOk && !buyerPolishedShell ? (
        <p className={cn("mb-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="note">
          {auditExportExecuteRankAuditorRoleNote}
        </p>
      ) : null}

      {props.failure !== null ? (
        <div
          role="alert"
          data-testid={buyerPolishedShell ? "audit-page-load-error" : undefined}
        >
          {buyerPolishedShell ? (
            <>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{GOVERNANCE_AUDIT_LOAD_ERROR}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                data-testid="audit-page-load-retry"
                onClick={() => {
                  void props.runSearch();
                }}
              >
                {GOVERNANCE_AUDIT_LOAD_ERROR_RETRY_LABEL}
              </Button>
            </>
          ) : (
            <OperatorApiProblem
              problem={props.failure.problem}
              fallbackMessage={props.failure.message}
              correlationId={props.failure.correlationId}
            />
          )}
        </div>
      ) : null}

      <div className={cn(buyerPolishedShell && "flex flex-col")}>
        <div className={cn(buyerPolishedShell && "order-2")}>
          <AuditSaveViewCoach
            filtersActive={props.auditFiltersActive}
            showSavedViews={!buyerPolishedShell && props.canMutateEnterpriseShell}
          />
          {props.runId.trim().length === 0 ? (
            <AuditPickReviewBeforeSearchStrip
              selectedReviewId={props.runId}
              onSelectReview={(reviewId) => {
                props.setRunId(reviewId);
              }}
            />
          ) : (
            <>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="governance-audit-run-scope-banner"
              >
                {"Searching audit trail for review "}
                <span className="font-mono text-al-text-primary">{scopedRunId}</span>
                {" · "}
                <Link className={OPERATOR_LINK.inline} href={auditClearScopeHref}>
                  Clear review scope
                </Link>
                {" · "}
                <Link className={OPERATOR_LINK.inline} href={reviewPackageHref}>
                  Open review
                </Link>
              </p>
              <IntegrationConnectChecklist
                title="Search checklist"
                steps={auditSearchSteps}
                emphasizedStepId={auditSearchEmphasizedStepId}
                testIdPrefix="audit-search"
              />
            </>
          )}
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

      {props.runId.trim().length > 0 ? <AuditNextReviewFooterClient runId={props.runId.trim()} /> : null}
      </div>
    </OperatorPageContainer>
  );
}
