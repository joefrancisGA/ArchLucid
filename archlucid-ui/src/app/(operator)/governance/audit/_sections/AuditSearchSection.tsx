import { cn } from "@/lib/utils";

import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { OperatorSavedViewPayload } from "@/lib/operator/operator-saved-view-types";

import { AuditSearchBuyerChrome } from "./AuditSearchBuyerChrome";
import { AuditSearchDatePresetButtons } from "./AuditSearchDateRangeFields";
import { AuditSearchFiltersForm } from "./AuditSearchFiltersForm";

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
      <AuditSearchBuyerChrome
        buyerPolishedShell={buyerPolishedShell}
        buyerOmitSearchFiltersChrome={buyerOmitSearchFiltersChrome}
        buyerCompactFilters={buyerCompactFilters}
        callerAuthorityRank={callerAuthorityRank}
        runId={runId}
        showSavedViews={showSavedViews}
        searching={searching}
        loadingTypes={loadingTypes}
        getAuditSavedViewPayload={getAuditSavedViewPayload}
        loadAuditSavedView={loadAuditSavedView}
      />
      {!buyerPolishedShell ? (
        <div className="mb-3 flex flex-wrap gap-2">
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
      ) : null}
      <AuditSearchFiltersForm
        buyerPolishedShell={buyerPolishedShell}
        callerAuthorityRank={callerAuthorityRank}
        canMutateEnterpriseShell={canMutateEnterpriseShell}
        advancedAuditFiltersOpen={advancedAuditFiltersOpen}
        setAdvancedAuditFiltersOpen={setAdvancedAuditFiltersOpen}
        buyerPrimaryFiltersOpen={buyerPrimaryFiltersOpen}
        setBuyerPrimaryFiltersOpen={setBuyerPrimaryFiltersOpen}
        eventTypes={eventTypes}
        eventType={eventType}
        setEventType={setEventType}
        fromUtc={fromUtc}
        setFromUtc={setFromUtc}
        toUtc={toUtc}
        setToUtc={setToUtc}
        correlationId={correlationId}
        setCorrelationId={setCorrelationId}
        actorUserId={actorUserId}
        setActorUserId={setActorUserId}
        runId={runId}
        setRunId={setRunId}
        searching={searching}
        loadingTypes={loadingTypes}
        auditDatePreset={auditDatePreset}
        applyAuditDatePreset={applyAuditDatePreset}
        clearDateRangeAndSearch={clearDateRangeAndSearch}
        runSearch={runSearch}
        clearFiltersAndSearch={clearFiltersAndSearch}
      />
    </section>
  );
}
