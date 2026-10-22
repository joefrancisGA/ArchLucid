"use client";

import { useCallback, useEffect, useState } from "react";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { fetchGovernanceFindingsRegistersBundle } from "@/lib/api/governance-stickiness-api";
import { isApiRequestError } from "@/lib/api-request-error";
import {
  decisionRegisterRows,
  dedupeGovernanceFindingRows,
  riskRegisterRows,
} from "@/components/governance/findings/governance-findings-row-mappers";
import {
  FINDINGS_HELP_READINESS_LABELS,
  FINDINGS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL,
} from "@/lib/findings/findings-help-guide-content";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  matchesRiskRegisterFilter,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";
import {
  buildGovernanceFindingsQueueHref,
  workspaceOpenFindingsPresentation,
} from "@/lib/metric-count-presentation";

export type FindingsHelpWorkspaceReadinessMetric = {
  readonly label: string;
  readonly valueLabel: string;
  readonly statusKind: EnterpriseStatusKind;
  readonly href: string;
};

export type FindingsHelpWorkspaceReadinessSnapshot = {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly loadForbidden: boolean;
  readonly openFindings: FindingsHelpWorkspaceReadinessMetric;
  readonly criticalAndError: FindingsHelpWorkspaceReadinessMetric;
  readonly awaitingDecision: FindingsHelpWorkspaceReadinessMetric;
  readonly recentlyResolved: FindingsHelpWorkspaceReadinessMetric;
  readonly workspaceScopeLabel: string | null;
  readonly loadedAtUtc: string | null;
  readonly reload: () => void;
};

const INITIAL_METRIC: FindingsHelpWorkspaceReadinessMetric = {
  label: "",
  valueLabel: "…",
  statusKind: "neutral",
  href: "/governance/findings",
};

const INITIAL_SNAPSHOT: Omit<FindingsHelpWorkspaceReadinessSnapshot, "reload"> = {
  loading: true,
  loadFailed: false,
  loadForbidden: false,
  openFindings: { ...INITIAL_METRIC, label: FINDINGS_HELP_READINESS_LABELS.openFindings },
  criticalAndError: { ...INITIAL_METRIC, label: FINDINGS_HELP_READINESS_LABELS.criticalAndError },
  awaitingDecision: { ...INITIAL_METRIC, label: FINDINGS_HELP_READINESS_LABELS.awaitingDecision },
  recentlyResolved: { ...INITIAL_METRIC, label: FINDINGS_HELP_READINESS_LABELS.recentlyResolved },
  workspaceScopeLabel: null,
  loadedAtUtc: null,
};

function formatMetricCountValue(count: number): string {
  return String(count);
}

function resolveCountStatusKind(count: number, attentionWhenPositive = true): EnterpriseStatusKind {
  if (count === 0) {
    return "neutral";
  }

  if (attentionWhenPositive) {
    return "needs-attention";
  }

  return "ready";
}

function countMatchingFilter(
  rows: readonly GovernanceFindingQueueRow[],
  filter: RiskRegisterFilter,
  nowMs: number,
): number {
  return rows.filter((row) => matchesRiskRegisterFilter(row, filter, nowMs)).length;
}

function buildReadinessMetric(
  label: string,
  count: number,
  href: string,
  attentionWhenPositive = true,
): FindingsHelpWorkspaceReadinessMetric {
  return {
    label,
    valueLabel: formatMetricCountValue(count),
    statusKind: resolveCountStatusKind(count, attentionWhenPositive),
    href,
  };
}

function summarizeFindingsRows(rows: readonly GovernanceFindingQueueRow[]): Omit<
  FindingsHelpWorkspaceReadinessSnapshot,
  "loading" | "loadFailed" | "loadForbidden" | "workspaceScopeLabel" | "loadedAtUtc" | "reload"
> {
  const nowMs = Date.now();
  const openCount = countMatchingFilter(rows, "open", nowMs);
  const criticalErrorCount = countMatchingFilter(rows, "critical-error", nowMs);
  const awaitingCount = countMatchingFilter(rows, "needs-decision", nowMs);
  const recentCount = countMatchingFilter(rows, "remediated-recent", nowMs);

  return {
    openFindings: buildReadinessMetric(
      FINDINGS_HELP_READINESS_LABELS.openFindings,
      openCount,
      workspaceOpenFindingsPresentation(openCount).href,
    ),
    criticalAndError: buildReadinessMetric(
      FINDINGS_HELP_READINESS_LABELS.criticalAndError,
      criticalErrorCount,
      buildGovernanceFindingsQueueHref({ filter: "critical-error" }),
    ),
    awaitingDecision: buildReadinessMetric(
      FINDINGS_HELP_READINESS_LABELS.awaitingDecision,
      awaitingCount,
      buildGovernanceFindingsQueueHref({ filter: "needs-decision" }),
    ),
    recentlyResolved: buildReadinessMetric(
      FINDINGS_HELP_READINESS_LABELS.recentlyResolved,
      recentCount,
      buildGovernanceFindingsQueueHref({ filter: "remediated-recent" }),
      false,
    ),
  };
}

function unavailableMetric(label: string): FindingsHelpWorkspaceReadinessMetric {
  return {
    label,
    valueLabel: "Unavailable",
    statusKind: "blocked",
    href: "/governance/findings",
  };
}

function isAuthorizationFailure(error: unknown): boolean {
  return isApiRequestError(error) && (error.httpStatus === 401 || error.httpStatus === 403);
}

export function useFindingsHelpWorkspaceReadiness(): FindingsHelpWorkspaceReadinessSnapshot {
  const [snapshot, setSnapshot] = useState<Omit<FindingsHelpWorkspaceReadinessSnapshot, "reload">>(
    INITIAL_SNAPSHOT,
  );

  const load = useCallback(async (): Promise<void> => {
    setSnapshot((prev) => ({
      ...prev,
      loading: true,
      loadFailed: false,
      loadForbidden: false,
      workspaceScopeLabel: null,
    }));

    try {
      const bundle = await fetchGovernanceFindingsRegistersBundle();
      const riskRegister = bundle.riskRegister;
      const decisionRegister = bundle.decisionRegister;
      const rows = dedupeGovernanceFindingRows([
        ...riskRegisterRows(riskRegister.entries ?? []),
        ...decisionRegisterRows(decisionRegister.decisions ?? []),
      ]);
      const summary = summarizeFindingsRows(rows);

      setSnapshot({
        loading: false,
        loadFailed: false,
        loadForbidden: false,
        ...summary,
        workspaceScopeLabel: FINDINGS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL,
        loadedAtUtc: new Date().toISOString(),
      });
    } catch (error) {
      if (isAuthorizationFailure(error)) {
        setSnapshot({
          loading: false,
          loadFailed: false,
          loadForbidden: true,
          openFindings: { ...INITIAL_METRIC, label: FINDINGS_HELP_READINESS_LABELS.openFindings },
          criticalAndError: { ...INITIAL_METRIC, label: FINDINGS_HELP_READINESS_LABELS.criticalAndError },
          awaitingDecision: { ...INITIAL_METRIC, label: FINDINGS_HELP_READINESS_LABELS.awaitingDecision },
          recentlyResolved: { ...INITIAL_METRIC, label: FINDINGS_HELP_READINESS_LABELS.recentlyResolved },
          workspaceScopeLabel: null,
          loadedAtUtc: null,
        });

        return;
      }

      setSnapshot({
        loading: false,
        loadFailed: true,
        loadForbidden: false,
        openFindings: unavailableMetric(FINDINGS_HELP_READINESS_LABELS.openFindings),
        criticalAndError: unavailableMetric(FINDINGS_HELP_READINESS_LABELS.criticalAndError),
        awaitingDecision: unavailableMetric(FINDINGS_HELP_READINESS_LABELS.awaitingDecision),
        recentlyResolved: unavailableMetric(FINDINGS_HELP_READINESS_LABELS.recentlyResolved),
        workspaceScopeLabel: null,
        loadedAtUtc: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...snapshot,
    reload: load,
  };
}

export { FINDINGS_HELP_READINESS_LABELS };
