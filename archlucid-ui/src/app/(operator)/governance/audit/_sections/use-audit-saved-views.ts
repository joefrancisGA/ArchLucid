"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AuditEvent, CursorPagedResponse } from "@/lib/api";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { AuditSavedViewFilters } from "@/lib/operator/operator-saved-view-types";

import {
  type AuditFilterFields,
  buildAuditSavedViewPayload,
} from "./audit-page-helpers";
import { shouldInjectAuditDemoOnSearchError } from "./resolve-audit-search-page-for-ui";

export type UseAuditSavedViewsParams = {
  readonly currentFilters: () => AuditFilterFields;
  readonly auditDatePreset: null | "24h" | "7d";
  readonly advancedAuditFiltersOpen: boolean;
  readonly executeSearch: (filters: AuditFilterFields, loadMoreCursor?: string | null) => Promise<CursorPagedResponse<AuditEvent>>;
  readonly applySearchPageToState: (page: CursorPagedResponse<AuditEvent>, filters: AuditFilterFields) => void;
  readonly applyDemoAuditFallback: () => void;
  readonly setEventType: Dispatch<SetStateAction<string>>;
  readonly setFromUtc: Dispatch<SetStateAction<string>>;
  readonly setToUtc: Dispatch<SetStateAction<string>>;
  readonly setCorrelationId: Dispatch<SetStateAction<string>>;
  readonly setActorUserId: Dispatch<SetStateAction<string>>;
  readonly setRunId: Dispatch<SetStateAction<string>>;
  readonly setAuditDatePreset: Dispatch<SetStateAction<null | "24h" | "7d">>;
  readonly setAdvancedAuditFiltersOpen: Dispatch<SetStateAction<boolean>>;
  readonly setSearching: Dispatch<SetStateAction<boolean>>;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
};

export type UseAuditSavedViewsResult = {
  readonly getAuditSavedViewPayload: () => ReturnType<typeof buildAuditSavedViewPayload>;
  readonly loadAuditSavedView: (view: OperatorSavedView) => Promise<void>;
};

export function useAuditSavedViews(params: UseAuditSavedViewsParams): UseAuditSavedViewsResult {
  const {
    currentFilters,
    auditDatePreset,
    advancedAuditFiltersOpen,
    executeSearch,
    applySearchPageToState,
    applyDemoAuditFallback,
    setEventType,
    setFromUtc,
    setToUtc,
    setCorrelationId,
    setActorUserId,
    setRunId,
    setAuditDatePreset,
    setAdvancedAuditFiltersOpen,
    setSearching,
    setFailure,
  } = params;

  const getAuditSavedViewPayload = useCallback(
    () => buildAuditSavedViewPayload(currentFilters(), auditDatePreset, advancedAuditFiltersOpen),
    [advancedAuditFiltersOpen, auditDatePreset, currentFilters],
  );

  const loadAuditSavedView = useCallback(
    async (view: OperatorSavedView) => {
      const filters = view.payload.filters as AuditSavedViewFilters;
      const nextFilters: AuditFilterFields = {
        eventType: filters.eventType ?? "",
        fromUtc: filters.fromUtc ?? "",
        toUtc: filters.toUtc ?? "",
        correlationId: filters.correlationId ?? "",
        actorUserId: filters.actorUserId ?? "",
        runId: filters.runId ?? "",
      };

      setEventType(nextFilters.eventType);
      setFromUtc(nextFilters.fromUtc);
      setToUtc(nextFilters.toUtc);
      setCorrelationId(nextFilters.correlationId);
      setActorUserId(nextFilters.actorUserId);
      setRunId(nextFilters.runId);
      setAuditDatePreset(filters.auditDatePreset ?? null);
      setAdvancedAuditFiltersOpen(
        filters.advancedAuditFiltersOpen ?? view.payload.columnVisibility?.showAdvancedFilters === true,
      );
      setSearching(true);
      setFailure(null);

      try {
        const page = await executeSearch(nextFilters);

        applySearchPageToState(page, nextFilters);
      } catch (error) {
        if (shouldInjectAuditDemoOnSearchError(nextFilters)) {
          applyDemoAuditFallback();
        } else {
          setFailure(toApiLoadFailure(error));
        }
      } finally {
        setSearching(false);
      }
    },
    [
      applyDemoAuditFallback,
      applySearchPageToState,
      executeSearch,
      setActorUserId,
      setAdvancedAuditFiltersOpen,
      setAuditDatePreset,
      setCorrelationId,
      setEventType,
      setFailure,
      setFromUtc,
      setRunId,
      setSearching,
      setToUtc,
    ],
  );

  return {
    getAuditSavedViewPayload,
    loadAuditSavedView,
  };
}
