"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { findingsPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";

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

function initialReadinessMetricHref(productLine: ProductLineId): string {
  return findingsPathForProductLine(productLine);
}

function buildInitialMetric(productLine: ProductLineId): FindingsHelpWorkspaceReadinessMetric {
  return {
    label: "",
    valueLabel: "…",
    statusKind: "neutral",
    href: initialReadinessMetricHref(productLine),
  };
}

function buildInitialSnapshot(productLine: ProductLineId): Omit<FindingsHelpWorkspaceReadinessSnapshot, "reload"> {
  const metric = buildInitialMetric(productLine);

  return {
    loading: true,
    loadFailed: false,
    loadForbidden: false,
    openFindings: { ...metric, label: FINDINGS_HELP_READINESS_LABELS.openFindings },
    criticalAndError: { ...metric, label: FINDINGS_HELP_READINESS_LABELS.criticalAndError },
    awaitingDecision: { ...metric, label: FINDINGS_HELP_READINESS_LABELS.awaitingDecision },
    recentlyResolved: { ...metric, label: FINDINGS_HELP_READINESS_LABELS.recentlyResolved },
    workspaceScopeLabel: null,
    loadedAtUtc: null,
  };
}

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

function summarizeFindingsRows(
  rows: readonly GovernanceFindingQueueRow[],
  productLine: ProductLineId,
): Omit<
  FindingsHelpWorkspaceReadinessSnapshot,
  "loading" | "loadFailed" | "loadForbidden" | "workspaceScopeLabel" | "loadedAtUtc" | "reload"
> {
  const nowMs = Date.now();
  const openCount = countMatchingFilter(rows, "open", nowMs);
  const criticalErrorCount = countMatchingFilter(rows, "critical-error", nowMs);
  const awaitingCount = countMatchingFilter(rows, "needs-decision", nowMs);
  const recentCount = countMatchingFilter(rows, "remediated-recent", nowMs);
  const queueBasePath = findingsPathForProductLine(productLine);

  return {
    openFindings: buildReadinessMetric(
      FINDINGS_HELP_READINESS_LABELS.openFindings,
      openCount,
      workspaceOpenFindingsPresentation(openCount, productLine).href,
    ),
    criticalAndError: buildReadinessMetric(
      FINDINGS_HELP_READINESS_LABELS.criticalAndError,
      criticalErrorCount,
      buildGovernanceFindingsQueueHref({ filter: "critical-error", basePath: queueBasePath }),
    ),
    awaitingDecision: buildReadinessMetric(
      FINDINGS_HELP_READINESS_LABELS.awaitingDecision,
      awaitingCount,
      buildGovernanceFindingsQueueHref({ filter: "needs-decision", basePath: queueBasePath }),
    ),
    recentlyResolved: buildReadinessMetric(
      FINDINGS_HELP_READINESS_LABELS.recentlyResolved,
      recentCount,
      buildGovernanceFindingsQueueHref({ filter: "remediated-recent", basePath: queueBasePath }),
      false,
    ),
  };
}

function unavailableMetric(label: string, productLine: ProductLineId): FindingsHelpWorkspaceReadinessMetric {
  return {
    label,
    valueLabel: "Unavailable",
    statusKind: "blocked",
    href: findingsPathForProductLine(productLine),
  };
}

function isAuthorizationFailure(error: unknown): boolean {
  return isApiRequestError(error) && (error.httpStatus === 401 || error.httpStatus === 403);
}

export function useFindingsHelpWorkspaceReadiness(): FindingsHelpWorkspaceReadinessSnapshot {
  const { productLine } = useProductLine();
  const [snapshot, setSnapshot] = useState<Omit<FindingsHelpWorkspaceReadinessSnapshot, "reload">>(() =>
    buildInitialSnapshot(productLine),
  );
  // Vitest tears down jsdom before late governance-register fetches settle — skip setState then.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    if (mountedRef.current) {
      setSnapshot((prev) => ({
        ...prev,
        loading: true,
        loadFailed: false,
        loadForbidden: false,
        workspaceScopeLabel: null,
      }));
    }

    try {
      const bundle = await fetchGovernanceFindingsRegistersBundle();
      const riskRegister = bundle.riskRegister;
      const decisionRegister = bundle.decisionRegister;
      const rows = dedupeGovernanceFindingRows([
        ...riskRegisterRows(riskRegister.entries ?? []),
        ...decisionRegisterRows(decisionRegister.decisions ?? []),
      ]);
      const summary = summarizeFindingsRows(rows, productLine);

      if (!mountedRef.current) {
        return;
      }

      setSnapshot({
        loading: false,
        loadFailed: false,
        loadForbidden: false,
        ...summary,
        workspaceScopeLabel: FINDINGS_HELP_WORKSPACE_SCOPE_FALLBACK_LABEL,
        loadedAtUtc: new Date().toISOString(),
      });
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      if (isAuthorizationFailure(error)) {
        const metric = buildInitialMetric(productLine);

        setSnapshot({
          loading: false,
          loadFailed: false,
          loadForbidden: true,
          openFindings: { ...metric, label: FINDINGS_HELP_READINESS_LABELS.openFindings },
          criticalAndError: { ...metric, label: FINDINGS_HELP_READINESS_LABELS.criticalAndError },
          awaitingDecision: { ...metric, label: FINDINGS_HELP_READINESS_LABELS.awaitingDecision },
          recentlyResolved: { ...metric, label: FINDINGS_HELP_READINESS_LABELS.recentlyResolved },
          workspaceScopeLabel: null,
          loadedAtUtc: null,
        });

        return;
      }

      setSnapshot({
        loading: false,
        loadFailed: true,
        loadForbidden: false,
        openFindings: unavailableMetric(FINDINGS_HELP_READINESS_LABELS.openFindings, productLine),
        criticalAndError: unavailableMetric(FINDINGS_HELP_READINESS_LABELS.criticalAndError, productLine),
        awaitingDecision: unavailableMetric(FINDINGS_HELP_READINESS_LABELS.awaitingDecision, productLine),
        recentlyResolved: unavailableMetric(FINDINGS_HELP_READINESS_LABELS.recentlyResolved, productLine),
        workspaceScopeLabel: null,
        loadedAtUtc: new Date().toISOString(),
      });
    }
  }, [productLine]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...snapshot,
    reload: load,
  };
}

export { FINDINGS_HELP_READINESS_LABELS };
