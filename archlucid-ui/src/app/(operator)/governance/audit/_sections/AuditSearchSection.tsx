import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

import { OperatorSavedViewsBar } from "@/components/OperatorSavedViewsBar";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { OperatorSavedViewPayload } from "@/lib/operator/operator-saved-view-types";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  auditClearFiltersButtonLabelReaderRank,
  auditSearchEventsButtonLabelReaderRank,
  auditSearchEventsButtonTitleOperator,
  auditSearchEventsButtonTitleReader,
  auditSearchEventsSectionHeadingBuyerPolished,
  auditSearchEventsSectionHeadingOperator,
  auditSearchEventsSectionHeadingReader,
  auditSearchSectionLeadReaderLine,
} from "@/lib/enterprise-controls-context-copy";
import {
  AUDIT_TRAIL_FILTERS_COLLAPSIBLE_SUMMARY,
  AUDIT_TRAIL_FILTERS_EMPTY_HINT,
} from "@/lib/audit-trail-page-copy";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer/buyer-facing-review-title";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { auditRunIdInputDisplayValue, auditRunIdParseInputValue } from "./audit-page-helpers";

type AuditSearchSectionProps = {
  buyerPolishedShell: boolean;
  /** Buyer demo: hide optional filter chrome when the loaded timeline is already a short, curated walkthrough. */
  buyerOmitSearchFiltersChrome: boolean;
  /** Buyer demo: compact filter card when no events are loaded. */
  buyerCompactFilters: boolean;
  callerAuthorityRank: number;
  canMutateEnterpriseShell: boolean;
  advancedAuditFiltersOpen: boolean;
  setAdvancedAuditFiltersOpen: (open: boolean) => void;
  buyerPrimaryFiltersOpen: boolean;
  setBuyerPrimaryFiltersOpen: (open: boolean) => void;
  eventTypes: string[];
  eventType: string;
  setEventType: (value: string) => void;
  fromUtc: string;
  setFromUtc: (value: string) => void;
  toUtc: string;
  setToUtc: (value: string) => void;
  correlationId: string;
  setCorrelationId: (value: string) => void;
  actorUserId: string;
  setActorUserId: (value: string) => void;
  runId: string;
  setRunId: (value: string) => void;
  searching: boolean;
  loadingTypes: boolean;
  auditDatePreset: null | "24h" | "7d";
  applyAuditDatePreset: (preset: "24h" | "7d") => void | Promise<void>;
  clearDateRangeAndSearch: () => void | Promise<void>;
  runSearch: () => void | Promise<void>;
  clearFiltersAndSearch: () => void | Promise<void>;
  showSavedViews?: boolean;
  getAuditSavedViewPayload?: () => OperatorSavedViewPayload;
  loadAuditSavedView?: (view: OperatorSavedView) => void | Promise<void>;
};

export function AuditSearchSection(props: AuditSearchSectionProps) {
  const {
    buyerPolishedShell,
    buyerOmitSearchFiltersChrome,
    buyerCompactFilters,
    callerAuthorityRank,
    canMutateEnterpriseShell,
    advancedAuditFiltersOpen,
    setAdvancedAuditFiltersOpen,
    buyerPrimaryFiltersOpen,
    setBuyerPrimaryFiltersOpen,
    eventTypes,
    eventType,
    setEventType,
    fromUtc,
    setFromUtc,
    toUtc,
    setToUtc,
    correlationId,
    setCorrelationId,
    actorUserId,
    setActorUserId,
    runId,
    setRunId,
    searching,
    loadingTypes,
    auditDatePreset,
    applyAuditDatePreset,
    clearDateRangeAndSearch,
    runSearch,
    clearFiltersAndSearch,
    showSavedViews = false,
    getAuditSavedViewPayload,
    loadAuditSavedView,
  } = props;

  return (
    <section
      aria-labelledby="audit-search-heading"
      className={cn(
        "rounded-lg mb-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700",
        buyerCompactFilters ? "p-2" : "p-3",
      )}
    >
      {showSavedViews && getAuditSavedViewPayload !== undefined && loadAuditSavedView !== undefined ? (
        <OperatorSavedViewsBar
          surface="audit"
          disabled={searching || loadingTypes}
          getCurrentPayload={getAuditSavedViewPayload}
          onLoadView={loadAuditSavedView}
        />
      ) : null}
      <h3 id="audit-search-heading" className={cn("mt-0", buyerCompactFilters ? "mb-2" : "mb-3", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {buyerPolishedShell
          ? auditSearchEventsSectionHeadingBuyerPolished
          : callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
            ? auditSearchEventsSectionHeadingReader
            : auditSearchEventsSectionHeadingOperator}
      </h3>
      {buyerPolishedShell && buyerCompactFilters ? (
        <p className={cn("m-0 mb-2 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {AUDIT_TRAIL_FILTERS_EMPTY_HINT}
        </p>
      ) : null}
      {buyerPolishedShell && !buyerOmitSearchFiltersChrome && !buyerCompactFilters ? (
        <p className={cn("m-0 mb-3 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Open filters if you need to narrow events or switch reviews.
        </p>
      ) : null}
      {buyerPolishedShell && buyerOmitSearchFiltersChrome ? (
        <p
          className={cn("m-0 mb-3 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="audit-buyer-short-timeline-filter-omit"
        >
          Open filters if you need to switch reviews or narrow event types.
        </p>
      ) : null}
      {buyerPolishedShell && !buyerOmitSearchFiltersChrome && !buyerCompactFilters ? (
        <div className="mb-3 flex flex-wrap gap-2">
          <p
            className={cn(
              "m-0 inline-flex flex-wrap items-center gap-x-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-medium text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.badge,
            )}
            data-testid="audit-buyer-sample-timeline-chip"
          >
            <span className="text-al-text-secondary">Showing:</span>
            <strong className="font-semibold text-al-text-primary">
              {buyerFacingReviewLinkLabelFromRunId(
                runId.trim().length > 0 ? runId : SHOWCASE_STATIC_DEMO_RUN_ID,
              )}
            </strong>
            <span className="text-al-text-secondary">— full lifecycle</span>
          </p>
        </div>
      ) : null}
      {callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority && !buyerPolishedShell ? (
        <p className={cn("mb-2 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {auditSearchSectionLeadReaderLine}
        </p>
      ) : null}
      {!buyerPolishedShell ? (
        <div className="mb-3 flex flex-wrap gap-2">
          <>
            <button
              type="button"
              className={cn(
                "rounded border px-2 py-1 font-medium transition-colors",
                OPERATOR_TYPOGRAPHY.tab,
                auditDatePreset === "24h"
                  ? "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600 dark:bg-neutral-800/80"
                  : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
              )}
              disabled={searching || loadingTypes}
              onClick={() => {
                void applyAuditDatePreset("24h");
              }}
            >
              Last 24 hours
            </button>
            <button
              type="button"
              className={cn(
                "rounded border px-2 py-1 font-medium transition-colors",
                OPERATOR_TYPOGRAPHY.tab,
                auditDatePreset === "7d"
                  ? "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600 dark:bg-neutral-800/80"
                  : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
              )}
              disabled={searching || loadingTypes}
              onClick={() => {
                void applyAuditDatePreset("7d");
              }}
            >
              Last 7 days
            </button>
            {auditDatePreset !== null || fromUtc.length > 0 || toUtc.length > 0 ? (
              <button
                type="button"
                className={cn(
                  "rounded border border-neutral-300 bg-neutral-50 px-2 py-1 font-medium text-al-text-primary hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-950 dark:hover:bg-neutral-900",
                  OPERATOR_TYPOGRAPHY.tab,
                )}
                disabled={searching}
                onClick={() => {
                  void clearDateRangeAndSearch();
                }}
              >
                Clear date range
              </button>
            ) : null}
          </>
        </div>
      ) : null}
      {buyerPolishedShell ? (
        <Collapsible
          open={buyerPrimaryFiltersOpen}
          onOpenChange={setBuyerPrimaryFiltersOpen}
          className="mt-1"
        >
          <CollapsibleTrigger
            type="button"
            data-testid="audit-filters-collapsible-trigger"
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-left font-medium text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {AUDIT_TRAIL_FILTERS_COLLAPSIBLE_SUMMARY}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                buyerPrimaryFiltersOpen ? "rotate-0" : "-rotate-90",
              )}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
              <label>
                Event type{" "}
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  disabled={loadingTypes}
                  className="mt-1 w-full"
                >
                  <option value="">Any</option>
                  {eventTypes.map((t) => (
                    <option key={t} value={t}>
                      {pipelineEventTypeFriendlyLabel(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                From (local){" "}
                <input
                  type="datetime-local"
                  value={fromUtc}
                  onChange={(e) => setFromUtc(e.target.value)}
                  className="mt-1 w-full"
                />
              </label>
              <label>
                To (local){" "}
                <input
                  type="datetime-local"
                  value={toUtc}
                  onChange={(e) => setToUtc(e.target.value)}
                  className="mt-1 w-full"
                />
              </label>
              <label>
                Actor{" "}
                <input
                  value={actorUserId}
                  onChange={(e) => setActorUserId(e.target.value)}
                  className="mt-1 w-full"
                  placeholder="Filter by reviewer or service principal"
                />
              </label>
              <label>
                Review{" "}
                <input
                  aria-label="Review"
                  data-testid="audit-review-id-input"
                  value={auditRunIdInputDisplayValue(buyerPolishedShell, runId)}
                  onChange={(e) => setRunId(auditRunIdParseInputValue(buyerPolishedShell, e.target.value))}
                  className="mt-1 w-full"
                />
              </label>
              <label>
                Keyword{" "}
                <input
                  value={correlationId}
                  onChange={(e) => setCorrelationId(e.target.value)}
                  className="mt-1 w-full"
                  placeholder="Search actions, references, or correlation ids"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  "rounded border px-2 py-1 font-medium transition-colors",
                  OPERATOR_TYPOGRAPHY.tab,
                  auditDatePreset === "24h"
                    ? "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600 dark:bg-neutral-800/80"
                    : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
                )}
                disabled={searching || loadingTypes}
                onClick={() => {
                  void applyAuditDatePreset("24h");
                }}
              >
                Last 24 hours
              </button>
              <button
                type="button"
                className={cn(
                  "rounded border px-2 py-1 font-medium transition-colors",
                  OPERATOR_TYPOGRAPHY.tab,
                  auditDatePreset === "7d"
                    ? "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600 dark:bg-neutral-800/80"
                    : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
                )}
                disabled={searching || loadingTypes}
                onClick={() => {
                  void applyAuditDatePreset("7d");
                }}
              >
                Last 7 days
              </button>
              {auditDatePreset !== null || fromUtc.length > 0 || toUtc.length > 0 ? (
                <button
                  type="button"
                  className={cn(
                    "rounded border border-neutral-300 bg-neutral-50 px-2 py-1 font-medium text-al-text-primary hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-950 dark:hover:bg-neutral-900",
                    OPERATOR_TYPOGRAPHY.tab,
                  )}
                  disabled={searching}
                  onClick={() => {
                    void clearDateRangeAndSearch();
                  }}
                >
                  Clear date range
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="audit-search-button"
                onClick={() => void runSearch()}
                disabled={searching || loadingTypes}
                title={
                  callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
                    ? auditSearchEventsButtonTitleReader
                    : auditSearchEventsButtonTitleOperator
                }
              >
                {searching ? "Searching…" : canMutateEnterpriseShell ? "Search" : auditSearchEventsButtonLabelReaderRank}
              </button>
              <button
                type="button"
                onClick={() => void clearFiltersAndSearch()}
                disabled={searching}
                title={
                  canMutateEnterpriseShell
                    ? "Clear filter fields and run search with empty criteria"
                    : "Clear fields and re-run search (GET only; export rules unchanged)"
                }
              >
                {canMutateEnterpriseShell ? "Clear filters" : auditClearFiltersButtonLabelReaderRank}
              </button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            <label>
              Action (event type){" "}
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                disabled={loadingTypes}
                className="mt-1 w-full"
              >
                <option value="">Any</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Actor (user id){" "}
              <input
                value={actorUserId}
                onChange={(e) => setActorUserId(e.target.value)}
                className="mt-1 w-full"
                placeholder="Filter by architect or service principal"
              />
            </label>
            <>
              <label>
                From (local){" "}
                <input
                  type="datetime-local"
                  value={fromUtc}
                  onChange={(e) => setFromUtc(e.target.value)}
                  className="mt-1 w-full"
                />
              </label>
              <label>
                To (local){" "}
                <input
                  type="datetime-local"
                  value={toUtc}
                  onChange={(e) => setToUtc(e.target.value)}
                  className="mt-1 w-full"
                />
              </label>
            </>
            <label>
              Review ID{" "}
              <input
                aria-label="Review ID"
                data-testid="audit-review-id-input"
                value={auditRunIdInputDisplayValue(buyerPolishedShell, runId)}
                onChange={(e) => setRunId(auditRunIdParseInputValue(buyerPolishedShell, e.target.value))}
                className="mt-1 w-full"
              />
              {runId.trim().length > 0 ? (
                <span className={cn("mt-1 block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Showing events for <strong>{buyerFacingReviewLinkLabelFromRunId(runId)}</strong>.
                </span>
              ) : null}
            </label>
          </div>
          <Collapsible open={advancedAuditFiltersOpen} onOpenChange={setAdvancedAuditFiltersOpen} className="mt-2">
            <CollapsibleTrigger
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 text-left font-medium text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900",
                OPERATOR_TYPOGRAPHY.tab,
              )}
            >
              More filters (correlation ID)
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  advancedAuditFiltersOpen ? "rotate-0" : "-rotate-90",
                )}
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                <label>
                  Correlation ID{" "}
                  <input
                    value={correlationId}
                    onChange={(e) => setCorrelationId(e.target.value)}
                    className="mt-1 w-full"
                  />
                </label>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="audit-search-button"
              onClick={() => void runSearch()}
              disabled={searching || loadingTypes}
              title={
                callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
                  ? auditSearchEventsButtonTitleReader
                  : auditSearchEventsButtonTitleOperator
              }
            >
              {searching ? "Searching…" : canMutateEnterpriseShell ? "Search" : auditSearchEventsButtonLabelReaderRank}
            </button>
            <button
              type="button"
              onClick={() => void clearFiltersAndSearch()}
              disabled={searching}
              title={
                canMutateEnterpriseShell
                  ? "Clear filter fields and run search with empty criteria"
                  : "Clear fields and re-run search (GET only; export rules unchanged)"
              }
            >
              {canMutateEnterpriseShell ? "Clear filters" : auditClearFiltersButtonLabelReaderRank}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
