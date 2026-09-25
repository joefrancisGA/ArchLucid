"use client";

import { useMemo } from "react";

import { useAssignedToMeFindingsCountQuery } from "@/hooks/use-assigned-to-me-findings-count-query";
import { useAssignedToMeFindingsQuery } from "@/components/governance/findings/use-assigned-to-me-findings-query";
import { useGovernanceFindingsQuery } from "@/components/governance/findings/use-governance-findings-query";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import type { GovernanceJobId } from "@/lib/governance/governance-job-router";
import {
  countAssignedToMeLoadedFindings,
  hasAssignedToMeCountMismatch,
  resolveGovernanceFindingsLoadFailedPreset,
  resolveGovernanceFindingsPageSubtitle,
  resolveGovernanceFindingsPageTitle,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";
import { resolveGovernanceFindingsQueueHeaderNavHref } from "@/lib/governance/resolve-governance-findings-queue-header-nav-href";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

export type UseGovernanceFindingsQueueModeInput = {
  readonly mode: GovernanceFindingsQueueMode;
  readonly workingMode?: boolean;
  readonly pathname?: string | null;
  readonly scopedArchitectureId?: string | null;
  readonly architectureDisplayName?: string | null;
  readonly scopedRunId?: string | null;
  readonly scopedRunTitle?: string | null;
};

export function useGovernanceFindingsQueueMode({
  mode,
  workingMode = false,
  pathname = null,
  scopedArchitectureId = null,
  architectureDisplayName = null,
  scopedRunId = null,
  scopedRunTitle = null,
}: UseGovernanceFindingsQueueModeInput) {
  const { productLine } = useProductLine();
  const isAssignedToMe = mode === "assigned-to-me";
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const tenantQuery = useGovernanceFindingsQuery(!isAssignedToMe);
  const assignedToMeQuery = useAssignedToMeFindingsQuery(isAssignedToMe);
  const assignedToMeCountQuery = useAssignedToMeFindingsCountQuery({ enabled: isAssignedToMe });
  const activeQuery = isAssignedToMe ? assignedToMeQuery : tenantQuery;

  const { rows, loading, loadFailed, refresh } = activeQuery;
  const assignedToMeFetchBasis = isAssignedToMe ? assignedToMeQuery.fetchBasis : null;
  const assignedToMeCheckedAt =
    isAssignedToMe && assignedToMeQuery.dataUpdatedAt > 0
      ? new Date(assignedToMeQuery.dataUpdatedAt)
      : null;
  const loadFailure = isAssignedToMe ? assignedToMeQuery.loadFailure : tenantQuery.loadFailure;

  const presentationOptions = {
    workingMode,
    pathname,
    scopedArchitectureId,
    architectureDisplayName,
    scopedRunId,
    scopedRunTitle,
  };
  const pageTitle = resolveGovernanceFindingsPageTitle(
    isAssignedToMe,
    buyerPolishedShell,
    presentationOptions,
  );
  const pageSubtitle = resolveGovernanceFindingsPageSubtitle(
    isAssignedToMe,
    buyerPolishedShell,
    productLine,
    presentationOptions,
  );
  const navHref = resolveGovernanceFindingsQueueHeaderNavHref({
    isAssignedToMe,
    workingMode,
    scopedArchitectureId,
    pathname,
    productLineId: productLine,
  });
  const currentJobId: GovernanceJobId = isAssignedToMe ? "assigned-to-me-findings" : "triage-findings";
  const loadFailedPreset = resolveGovernanceFindingsLoadFailedPreset(isAssignedToMe);

  const assignedToMeCount = assignedToMeCountQuery.data ?? rows.length;
  const assignedToMeLoadedFindingCount = useMemo(
    () => countAssignedToMeLoadedFindings(rows),
    [rows],
  );
  const assignedToMeCountMismatch = hasAssignedToMeCountMismatch({
    isAssignedToMe,
    loading,
    loadFailed,
    assignedToMeCountData: assignedToMeCountQuery.data,
    assignedToMeLoadedFindingCount,
  });

  return {
    isAssignedToMe,
    buyerPolishedShell,
    tenantQuery,
    assignedToMeQuery,
    assignedToMeCountQuery,
    rows,
    loading,
    loadFailed,
    refresh,
    tenantLastRefreshedAt:
      !isAssignedToMe && tenantQuery.dataUpdatedAt > 0 ? new Date(tenantQuery.dataUpdatedAt) : null,
    tenantRefreshing: !isAssignedToMe && tenantQuery.refreshing,
    assignedToMeFetchBasis,
    assignedToMeCheckedAt,
    loadFailure,
    pageTitle,
    pageSubtitle,
    navHref,
    currentJobId,
    loadFailedPreset,
    assignedToMeCount,
    assignedToMeLoadedFindingCount,
    assignedToMeCountMismatch,
  };
}

export type GovernanceFindingsQueueModeState = ReturnType<typeof useGovernanceFindingsQueueMode>;
