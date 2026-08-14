"use client";

import { useSyncExternalStore } from "react";

import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { readActiveWorkspaceScopeLabel } from "@/lib/active-workspace-scope-label";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  subscribeOperatorScopeQueryKey,
} from "@/lib/operator/operator-scope-query-key";

export const SPONSOR_DASHBOARD_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL = "This workspace";

export type SponsorDashboardHelpWorkspaceReadinessSnapshot = {
  readonly loading: boolean;
  readonly baselineStatusLabel: string;
  readonly baselineStatusKind: EnterpriseStatusKind;
  readonly workspaceScopeLabel: string | null;
  readonly reload: () => void;
};

function resolveBaselineStatus(
  loading: boolean,
  complete: boolean | null,
): { readonly label: string; readonly kind: EnterpriseStatusKind } {
  if (loading) {
    return { label: "Loading", kind: "neutral" };
  }

  if (complete === true) {
    return { label: "Baseline anchors set", kind: "ready" };
  }

  if (complete === false) {
    return { label: "Baseline anchors needed", kind: "needs-attention" };
  }

  return { label: "Baseline status unknown", kind: "neutral" };
}

/** Live workspace scope and ROI baseline posture for `/help/sponsor-dashboard`. */
export function useSponsorDashboardHelpWorkspaceReadiness(): SponsorDashboardHelpWorkspaceReadinessSnapshot {
  const baseline = usePilotRoiBaselineCompleteness();
  const workspaceScopeLabel = useSyncExternalStore(
    subscribeOperatorScopeQueryKey,
    () => readActiveWorkspaceScopeLabel(),
    () => null,
  );

  const baselineStatus = resolveBaselineStatus(baseline.loading, baseline.complete);

  return {
    loading: baseline.loading,
    baselineStatusLabel: baselineStatus.label,
    baselineStatusKind: baselineStatus.kind,
    workspaceScopeLabel,
    reload: baseline.reload,
  };
}
