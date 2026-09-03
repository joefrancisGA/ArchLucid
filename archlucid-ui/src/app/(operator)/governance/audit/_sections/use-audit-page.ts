"use client";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";

import type { AuditPageViewProps } from "./audit-page-view-props";
import type { AuditPageServerLoad } from "./load-audit-page-data";
import { useAuditPageExport } from "./use-audit-page-export";
import { useAuditPageLifecycleGroups } from "./use-audit-page-lifecycle-groups";
import { useAuditPageSearch } from "./use-audit-page-search";
import { useAuditPageViewMode } from "./use-audit-page-view-mode";
import { useAuditSavedViews } from "./use-audit-saved-views";

/** Page controller: audit filters, search/export, and derived buyer display state. */
export function useAuditPage(serverLoad: AuditPageServerLoad): AuditPageViewProps {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canMutateEnterpriseShell = useOperateCapability();
  const viewMode = useAuditPageViewMode();
  const search = useAuditPageSearch(serverLoad, viewMode.buyerPolishedShell);

  const exportState = useAuditPageExport({
    fromUtc: search.fromUtc,
    toUtc: search.toUtc,
    currentFilters: search.currentFilters,
    setFailure: search.setFailure,
  });

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

  const lifecycle = useAuditPageLifecycleGroups({
    buyerPolishedShell: viewMode.buyerPolishedShell,
    viewMode: viewMode.viewMode,
    events: search.events,
    runId: search.runId,
    ctoDemoAuditFilterActive: search.ctoDemoAuditFilterActive,
  });

  return {
    buyerPolishedShell: viewMode.buyerPolishedShell,
    viewMode: viewMode.viewMode,
    currentSearch: viewMode.currentSearch,
    runId: search.runId,
    buyerAuditTrailSummaryLine: lifecycle.buyerAuditTrailSummaryLine,
    buyerAuditTrailMetrics: lifecycle.buyerAuditTrailMetrics,
    displayEvents: lifecycle.displayEvents,
    callerAuthorityRank,
    exportRoleOk: exportState.exportRoleOk,
    failure: search.failure,
    canMutateEnterpriseShell,
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
    displayEventGroups: lifecycle.displayEventGroups,
    hasMoreResults: search.hasMoreResults,
    loadingMore: search.loadingMore,
    uniformRunIdForDisplay: lifecycle.uniformRunIdForDisplay,
    auditSearchEmptyLine: lifecycle.auditSearchEmptyLine,
    loadMore: search.loadMore,
    csvExportUiAllowed: exportState.csvExportUiAllowed,
    exporting: exportState.exporting,
    exportDateRangeReady: exportState.exportDateRangeReady,
    onExportCsv: exportState.onExportCsv,
    getAuditSavedViewPayload: savedViews.getAuditSavedViewPayload,
    loadAuditSavedView: savedViews.loadAuditSavedView,
    ctoDemoAuditFilterActive: search.ctoDemoAuditFilterActive,
    onClearCtoDemoAuditFilter: search.onClearCtoDemoAuditFilter,
    auditFiltersActive: search.auditFiltersActive,
  };
}
