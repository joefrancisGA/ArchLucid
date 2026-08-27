import type { ReactElement } from "react";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  auditClearFiltersButtonLabelReaderRank,
  auditSearchEventsButtonLabelReaderRank,
  auditSearchEventsButtonTitleOperator,
  auditSearchEventsButtonTitleReader,
} from "@/lib/enterprise-controls-context-copy";
import { AUDIT_TRAIL_FILTERS_COLLAPSIBLE_SUMMARY } from "@/lib/audit-trail-page-copy";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer/buyer-facing-review-title";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { auditRunIdInputDisplayValue, auditRunIdParseInputValue } from "./audit-page-helpers";
import { AuditSearchDatePresetButtons, AuditSearchDateRangeFields } from "./AuditSearchDateRangeFields";

type AuditSearchFiltersFormProps = {
  readonly buyerPolishedShell: boolean;
  readonly callerAuthorityRank: number;
  readonly canMutateEnterpriseShell: boolean;
  readonly advancedAuditFiltersOpen: boolean;
  readonly setAdvancedAuditFiltersOpen: (open: boolean) => void;
  readonly buyerPrimaryFiltersOpen: boolean;
  readonly setBuyerPrimaryFiltersOpen: (open: boolean) => void;
  readonly eventTypes: string[];
  readonly eventType: string;
  readonly setEventType: (value: string) => void;
  readonly fromUtc: string;
  readonly setFromUtc: (value: string) => void;
  readonly toUtc: string;
  readonly setToUtc: (value: string) => void;
  readonly correlationId: string;
  readonly setCorrelationId: (value: string) => void;
  readonly actorUserId: string;
  readonly setActorUserId: (value: string) => void;
  readonly runId: string;
  readonly setRunId: (value: string) => void;
  readonly searching: boolean;
  readonly loadingTypes: boolean;
  readonly auditDatePreset: null | "24h" | "7d";
  readonly applyAuditDatePreset: (preset: "24h" | "7d") => void | Promise<void>;
  readonly clearDateRangeAndSearch: () => void | Promise<void>;
  readonly runSearch: () => void | Promise<void>;
  readonly clearFiltersAndSearch: () => void | Promise<void>;
};

export function AuditSearchFiltersForm(props: AuditSearchFiltersFormProps): ReactElement {
  const {
    buyerPolishedShell,
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
  } = props;

  const searchButtonLabel = searching
    ? "Searching…"
    : canMutateEnterpriseShell
      ? "Search"
      : auditSearchEventsButtonLabelReaderRank;

  const searchButtonAriaLabel = searching
    ? "Searching…"
    : `${canMutateEnterpriseShell ? "Search" : auditSearchEventsButtonLabelReaderRank}. ${
        callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
          ? auditSearchEventsButtonTitleReader
          : auditSearchEventsButtonTitleOperator
      }`;

  const clearFiltersLabel = canMutateEnterpriseShell ? "Clear filters" : auditClearFiltersButtonLabelReaderRank;

  const clearFiltersAriaLabel = canMutateEnterpriseShell
    ? "Clear filters. Clear filter fields and run search with empty criteria"
    : "Clear filters. Clear fields and re-run search (GET only; export rules unchanged)";

  if (buyerPolishedShell) {
    return (
      <Collapsible open={buyerPrimaryFiltersOpen} onOpenChange={setBuyerPrimaryFiltersOpen} className="mt-1">
        <CollapsibleTrigger
          type="button"
          data-testid="audit-filters-collapsible-trigger"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900",
            OPERATOR_TYPOGRAPHY.button,
          )}
        >
          {AUDIT_TRAIL_FILTERS_COLLAPSIBLE_SUMMARY}
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", buyerPrimaryFiltersOpen ? "rotate-0" : "-rotate-90")}
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
            <AuditSearchDateRangeFields
              fromUtc={fromUtc}
              setFromUtc={setFromUtc}
              toUtc={toUtc}
              setToUtc={setToUtc}
            />
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
            <AuditSearchDatePresetButtons
              searching={searching}
              loadingTypes={loadingTypes}
              auditDatePreset={auditDatePreset}
              fromUtc={fromUtc}
              toUtc={toUtc}
              applyAuditDatePreset={applyAuditDatePreset}
              clearDateRangeAndSearch={clearDateRangeAndSearch}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="audit-search-button"
              onClick={() => void runSearch()}
              disabled={searching || loadingTypes}
              aria-label={searchButtonAriaLabel}
            >
              {searchButtonLabel}
            </button>
            <button
              type="button"
              onClick={() => void clearFiltersAndSearch()}
              disabled={searching}
              aria-label={clearFiltersAriaLabel}
            >
              {clearFiltersLabel}
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
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
        <AuditSearchDateRangeFields
          fromUtc={fromUtc}
          setFromUtc={setFromUtc}
          toUtc={toUtc}
          setToUtc={setToUtc}
        />
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
            "flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 text-left text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900",
            OPERATOR_TYPOGRAPHY.button,
          )}
        >
          More filters (correlation ID)
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", advancedAuditFiltersOpen ? "rotate-0" : "-rotate-90")}
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
          aria-label={searchButtonAriaLabel}
        >
          {searchButtonLabel}
        </button>
        <button
          type="button"
          onClick={() => void clearFiltersAndSearch()}
          disabled={searching}
          aria-label={clearFiltersAriaLabel}
        >
          {clearFiltersLabel}
        </button>
      </div>
    </>
  );
}
