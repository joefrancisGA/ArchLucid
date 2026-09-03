"use client";

import { useCallback } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";

import type { AuditPageViewProps } from "./audit-page-view-props";
import type { AuditPageServerLoad } from "./load-audit-page-data";
import type { AuditFilterFields } from "./audit-page-helpers";
import { useAuditPageExport } from "./use-audit-page-export";
import { useAuditPageFilters } from "./use-audit-page-filters";
import { useAuditPageLifecycleGroups } from "./use-audit-page-lifecycle-groups";

/** Page controller: audit filters, search/export, and derived buyer display state. */
export function useAuditPage(serverLoad: AuditPageServerLoad): AuditPageViewProps {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canMutateEnterpriseShell = useOperateCapability();

  const filters = useAuditPageFilters(serverLoad);

  const currentFilters = useCallback(
    (): AuditFilterFields => ({
      eventType: filters.eventType,
      fromUtc: filters.fromUtc,
      toUtc: filters.toUtc,
      correlationId: filters.correlationId,
      actorUserId: filters.actorUserId,
      runId: filters.runId,
    }),
    [
      filters.actorUserId,
      filters.correlationId,
      filters.eventType,
      filters.fromUtc,
      filters.runId,
      filters.toUtc,
    ],
  );

  const exportState = useAuditPageExport({
    fromUtc: filters.fromUtc,
    toUtc: filters.toUtc,
    currentFilters,
    setFailure: filters.setFailure,
  });

  const lifecycle = useAuditPageLifecycleGroups({
    buyerPolishedShell: filters.buyerPolishedShell,
    viewMode: filters.viewMode,
    events: filters.events,
    runId: filters.runId,
    ctoDemoAuditFilterActive: filters.ctoDemoAuditFilterActive,
  });

  return {
    buyerPolishedShell: filters.buyerPolishedShell,
    viewMode: filters.viewMode,
    onViewModeChange: filters.onViewModeChange,
    runId: filters.runId,
    buyerAuditTrailSummaryLine: lifecycle.buyerAuditTrailSummaryLine,
    buyerAuditTrailMetrics: lifecycle.buyerAuditTrailMetrics,
    displayEvents: lifecycle.displayEvents,
    callerAuthorityRank,
    exportRoleOk: exportState.exportRoleOk,
    failure: filters.failure,
    canMutateEnterpriseShell,
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
    searching: filters.searching,
    lastRefreshedAt: filters.lastRefreshedAt,
    loadingTypes: filters.loadingTypes,
    auditDatePreset: filters.auditDatePreset,
    applyAuditDatePreset: filters.applyAuditDatePreset,
    clearDateRangeAndSearch: filters.clearDateRangeAndSearch,
    runSearch: filters.runSearch,
    clearFiltersAndSearch: filters.clearFiltersAndSearch,
    events: filters.events,
    displayEventGroups: lifecycle.displayEventGroups,
    hasMoreResults: filters.hasMoreResults,
    loadingMore: filters.loadingMore,
    uniformRunIdForDisplay: lifecycle.uniformRunIdForDisplay,
    auditSearchEmptyLine: lifecycle.auditSearchEmptyLine,
    loadMore: filters.loadMore,
    csvExportUiAllowed: exportState.csvExportUiAllowed,
    exporting: exportState.exporting,
    exportDateRangeReady: exportState.exportDateRangeReady,
    onExportCsv: exportState.onExportCsv,
    getAuditSavedViewPayload: filters.getAuditSavedViewPayload,
    loadAuditSavedView: filters.loadAuditSavedView,
    ctoDemoAuditFilterActive: filters.ctoDemoAuditFilterActive,
    onClearCtoDemoAuditFilter: filters.onClearCtoDemoAuditFilter,
    auditFiltersActive: filters.auditFiltersActive,
  };
}
