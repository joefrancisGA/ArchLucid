"use client";

import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { AuditEvent } from "@/lib/api";
import type { AuditTrailViewMode } from "@/lib/audit-trail-view-mode";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";

import type { AuditPageServerLoad } from "./load-audit-page-data";
import type { buildAuditSavedViewPayload } from "./audit-page-helpers";
import { useAuditPageViewMode } from "./use-audit-page-view-mode";
import { useAuditPageSearch } from "./use-audit-page-search";
import { useAuditSavedViews } from "./use-audit-saved-views";

export type UseAuditPageFiltersResult = {
  readonly buyerPolishedShell: boolean;
  readonly viewMode: AuditTrailViewMode;
  readonly onViewModeChange: (mode: AuditTrailViewMode) => void;
  readonly runId: string;
  readonly failure: ApiLoadFailureState | null;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
  readonly advancedAuditFiltersOpen: boolean;
  readonly setAdvancedAuditFiltersOpen: Dispatch<SetStateAction<boolean>>;
  readonly buyerPrimaryFiltersOpen: boolean;
  readonly setBuyerPrimaryFiltersOpen: Dispatch<SetStateAction<boolean>>;
  readonly eventTypes: string[];
  readonly eventType: string;
  readonly setEventType: Dispatch<SetStateAction<string>>;
  readonly fromUtc: string;
  readonly setFromUtc: Dispatch<SetStateAction<string>>;
  readonly toUtc: string;
  readonly setToUtc: Dispatch<SetStateAction<string>>;
  readonly correlationId: string;
  readonly setCorrelationId: Dispatch<SetStateAction<string>>;
  readonly actorUserId: string;
  readonly setActorUserId: Dispatch<SetStateAction<string>>;
  readonly setRunId: Dispatch<SetStateAction<string>>;
  readonly searching: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly loadingTypes: boolean;
  readonly auditDatePreset: null | "24h" | "7d";
  readonly applyAuditDatePreset: (preset: "24h" | "7d") => Promise<void>;
  readonly clearDateRangeAndSearch: () => Promise<void>;
  readonly runSearch: () => Promise<void>;
  readonly clearFiltersAndSearch: () => Promise<void>;
  readonly events: AuditEvent[];
  readonly hasMoreResults: boolean;
  readonly loadingMore: boolean;
  readonly loadMore: () => Promise<void>;
  readonly getAuditSavedViewPayload: () => ReturnType<typeof buildAuditSavedViewPayload>;
  readonly loadAuditSavedView: (view: OperatorSavedView) => Promise<void>;
  readonly ctoDemoAuditFilterActive: boolean;
  readonly onClearCtoDemoAuditFilter: () => void;
  readonly auditFiltersActive: boolean;
};

export function useAuditPageFilters(serverLoad: AuditPageServerLoad): UseAuditPageFiltersResult {
  const { buyerPolishedShell, viewMode, onViewModeChange } = useAuditPageViewMode();
  const search = useAuditPageSearch(serverLoad, buyerPolishedShell);
  const savedViews = useAuditSavedViews({
    currentFilters: search.currentFilters,
    auditDatePreset: search.auditDatePreset,
    advancedAuditFiltersOpen: search.advancedAuditFiltersOpen,
    executeSearch: search.executeSearch,
    applySearchPageToState: search.applySearchPageToState,
    applyDemoAuditFallback: search.applyDemoAuditFallback,
    setEventType: search.setEventType,
    setFromUtc: search.setFromUtc,
    setToUtc: search.setToUtc,
    setCorrelationId: search.setCorrelationId,
    setActorUserId: search.setActorUserId,
    setRunId: search.setRunId,
    setAuditDatePreset: search.setAuditDatePreset,
    setAdvancedAuditFiltersOpen: search.setAdvancedAuditFiltersOpen,
    setSearching: search.setSearching,
    setFailure: search.setFailure,
  });

  return {
    buyerPolishedShell,
    viewMode,
    onViewModeChange,
    runId: search.runId,
    failure: search.failure,
    setFailure: search.setFailure,
    advancedAuditFiltersOpen: search.advancedAuditFiltersOpen,
    setAdvancedAuditFiltersOpen: search.setAdvancedAuditFiltersOpen,
    buyerPrimaryFiltersOpen: search.buyerPrimaryFiltersOpen,
    setBuyerPrimaryFiltersOpen: search.setBuyerPrimaryFiltersOpen,
    eventTypes: search.eventTypes,
    eventType: search.eventType,
    setEventType: search.setEventType,
    fromUtc: search.fromUtc,
    setFromUtc: search.setFromUtc,
    toUtc: search.toUtc,
    setToUtc: search.setToUtc,
    correlationId: search.correlationId,
    setCorrelationId: search.setCorrelationId,
    actorUserId: search.actorUserId,
    setActorUserId: search.setActorUserId,
    setRunId: search.setRunId,
    searching: search.searching,
    lastRefreshedAt: search.lastRefreshedAt,
    loadingTypes: search.loadingTypes,
    auditDatePreset: search.auditDatePreset,
    applyAuditDatePreset: search.applyAuditDatePreset,
    clearDateRangeAndSearch: search.clearDateRangeAndSearch,
    runSearch: search.runSearch,
    clearFiltersAndSearch: search.clearFiltersAndSearch,
    events: search.events,
    hasMoreResults: search.hasMoreResults,
    loadingMore: search.loadingMore,
    loadMore: search.loadMore,
    getAuditSavedViewPayload: savedViews.getAuditSavedViewPayload,
    loadAuditSavedView: savedViews.loadAuditSavedView,
    ctoDemoAuditFilterActive: search.ctoDemoAuditFilterActive,
    onClearCtoDemoAuditFilter: search.onClearCtoDemoAuditFilter,
    auditFiltersActive: search.auditFiltersActive,
  };
}
