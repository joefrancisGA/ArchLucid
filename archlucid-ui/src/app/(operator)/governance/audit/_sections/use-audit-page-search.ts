"use client";

import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { AuditEvent, CursorPagedResponse } from "@/lib/api";

import type { AuditPageServerLoad } from "./load-audit-page-data";
import type { AuditFilterFields } from "./audit-page-helpers";
import { useAuditPageFilters } from "./use-audit-page-filters";
import { useAuditPageQuery } from "./use-audit-page-query";

export type UseAuditPageSearchResult = {
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
  readonly ctoDemoAuditFilterActive: boolean;
  readonly onClearCtoDemoAuditFilter: () => void;
  readonly auditFiltersActive: boolean;
  readonly currentFilters: () => AuditFilterFields;
  readonly executeSearch: (filters: AuditFilterFields, loadMoreCursor?: string | null) => Promise<CursorPagedResponse<AuditEvent>>;
  readonly applySearchPageToState: (page: CursorPagedResponse<AuditEvent>, filters: AuditFilterFields) => void;
  readonly applyDemoAuditFallback: () => void;
  readonly setSearching: Dispatch<SetStateAction<boolean>>;
  readonly setAuditDatePreset: Dispatch<SetStateAction<null | "24h" | "7d">>;
};

export function useAuditPageSearch(
  serverLoad: AuditPageServerLoad,
  buyerPolishedShell: boolean,
): UseAuditPageSearchResult {
  const filters = useAuditPageFilters(serverLoad, buyerPolishedShell);
  const query = useAuditPageQuery(filters);

  return {
    runId: filters.runId,
    failure: query.failure,
    setFailure: query.setFailure,
    advancedAuditFiltersOpen: filters.advancedAuditFiltersOpen,
    setAdvancedAuditFiltersOpen: filters.setAdvancedAuditFiltersOpen,
    buyerPrimaryFiltersOpen: filters.buyerPrimaryFiltersOpen,
    setBuyerPrimaryFiltersOpen: filters.setBuyerPrimaryFiltersOpen,
    eventTypes: filters.eventTypes,
    eventType: filters.eventType,
    setEventType: filters.setEventType,
    fromUtc: filters.fromUtc,
    setFromUtc: filters.setFromUtc,
    toUtc: filters.toUtc,
    setToUtc: filters.setToUtc,
    correlationId: filters.correlationId,
    setCorrelationId: filters.setCorrelationId,
    actorUserId: filters.actorUserId,
    setActorUserId: filters.setActorUserId,
    setRunId: filters.setRunId,
    searching: query.searching,
    lastRefreshedAt: query.lastRefreshedAt,
    loadingTypes: filters.loadingTypes,
    auditDatePreset: filters.auditDatePreset,
    applyAuditDatePreset: query.applyAuditDatePreset,
    clearDateRangeAndSearch: query.clearDateRangeAndSearch,
    runSearch: query.runSearch,
    clearFiltersAndSearch: query.clearFiltersAndSearch,
    events: query.events,
    hasMoreResults: query.hasMoreResults,
    loadingMore: query.loadingMore,
    loadMore: query.loadMore,
    ctoDemoAuditFilterActive: filters.ctoDemoAuditFilterActive,
    onClearCtoDemoAuditFilter: filters.onClearCtoDemoAuditFilter,
    auditFiltersActive: filters.auditFiltersActive,
    currentFilters: filters.currentFilters,
    executeSearch: query.executeSearch,
    applySearchPageToState: query.applySearchPageToState,
    applyDemoAuditFallback: query.applyDemoAuditFallback,
    setSearching: query.setSearching,
    setAuditDatePreset: filters.setAuditDatePreset,
  };
}
