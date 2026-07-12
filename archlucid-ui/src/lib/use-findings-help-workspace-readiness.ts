"use client";

import { useCallback, useEffect, useState } from "react";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { getArchitectureDecisionRegister, getArchitectureRiskRegister } from "@/lib/api/governance-stickiness-api";
import {
  decisionRegisterRows,
  dedupeGovernanceFindingRows,
  riskRegisterRows,
} from "@/components/governance/findings/governance-findings-row-mappers";
import { FINDINGS_HELP_READINESS_LABELS } from "@/lib/findings-help-guide-content";

export type FindingsHelpWorkspaceReadinessSnapshot = {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly openFindingsLabel: string;
  readonly criticalAndHighLabel: string;
  readonly awaitingDecisionLabel: string;
  readonly recentlyResolvedLabel: string;
};

const INITIAL_SNAPSHOT: FindingsHelpWorkspaceReadinessSnapshot = {
  loading: true,
  loadFailed: false,
  openFindingsLabel: "…",
  criticalAndHighLabel: "…",
  awaitingDecisionLabel: "…",
  recentlyResolvedLabel: "…",
};

const RECENTLY_RESOLVED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function isFindingRow(row: GovernanceFindingQueueRow): boolean {
  return row.recordKind === "finding";
}

function isOpenFinding(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  const normalized = row.status.toLowerCase();

  if (normalized.includes("recorded")) {
    return false;
  }

  if (normalized.includes("closed") || normalized.includes("resolved")) {
    return false;
  }

  return true;
}

function isCriticalOrHighSeverity(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  const normalized = row.severity.trim().toLowerCase();

  return (
    normalized === "critical"
    || normalized === "error"
    || normalized === "high"
    || normalized === "warning"
  );
}

function isAwaitingDecision(row: GovernanceFindingQueueRow): boolean {
  if (!isFindingRow(row) || !isOpenFinding(row)) {
    return false;
  }

  const disposition = (row.latestDisposition ?? "").trim();
  const humanReview = (row.humanReviewStatusLabel ?? "").toLowerCase();

  if (disposition.length > 0 && disposition !== "NeedsEvidence") {
    return false;
  }

  if (humanReview.includes("pending")) {
    return true;
  }

  return disposition.length === 0 || disposition === "NeedsEvidence";
}

function isRecentlyResolved(row: GovernanceFindingQueueRow, nowMs: number): boolean {
  if (!isFindingRow(row)) {
    return false;
  }

  const disposition = (row.latestDisposition ?? "").trim();

  if (disposition !== "Remediated") {
    return false;
  }

  const reviewedRaw = row.lastReviewedUtc?.trim() ?? "";

  if (reviewedRaw.length === 0) {
    return false;
  }

  const reviewedMs = Date.parse(reviewedRaw);

  if (Number.isNaN(reviewedMs)) {
    return false;
  }

  return nowMs - reviewedMs <= RECENTLY_RESOLVED_WINDOW_MS;
}

function formatCountLabel(count: number, singular: string, plural: string, empty: string): string {
  if (count === 0) {
    return empty;
  }

  if (count === 1) {
    return `1 ${singular}`;
  }

  return `${count} ${plural}`;
}

function summarizeFindingsRows(rows: readonly GovernanceFindingQueueRow[]): Omit<
  FindingsHelpWorkspaceReadinessSnapshot,
  "loading" | "loadFailed"
> {
  const nowMs = Date.now();
  const openCount = rows.filter((row) => isOpenFinding(row)).length;
  const criticalHighCount = rows.filter((row) => isOpenFinding(row) && isCriticalOrHighSeverity(row)).length;
  const awaitingCount = rows.filter((row) => isAwaitingDecision(row)).length;
  const recentCount = rows.filter((row) => isRecentlyResolved(row, nowMs)).length;

  return {
    openFindingsLabel: formatCountLabel(openCount, "open finding", "open findings", "No open findings"),
    criticalAndHighLabel: formatCountLabel(
      criticalHighCount,
      "critical or high finding",
      "critical or high findings",
      "No critical or high findings",
    ),
    awaitingDecisionLabel: formatCountLabel(
      awaitingCount,
      "finding awaiting decision",
      "findings awaiting decision",
      "No findings awaiting decision",
    ),
    recentlyResolvedLabel: formatCountLabel(
      recentCount,
      "recent resolution",
      "recent resolutions",
      "No recent resolutions",
    ),
  };
}

export function useFindingsHelpWorkspaceReadiness(): FindingsHelpWorkspaceReadinessSnapshot {
  const [snapshot, setSnapshot] = useState<FindingsHelpWorkspaceReadinessSnapshot>(INITIAL_SNAPSHOT);

  const load = useCallback(async (): Promise<void> => {
    setSnapshot((prev) => ({ ...prev, loading: true, loadFailed: false }));

    try {
      const [riskRegister, decisionRegister] = await Promise.all([
        getArchitectureRiskRegister(),
        getArchitectureDecisionRegister(),
      ]);
      const rows = dedupeGovernanceFindingRows([
        ...riskRegisterRows(riskRegister.entries ?? []),
        ...decisionRegisterRows(decisionRegister.decisions ?? []),
      ]);
      const summary = summarizeFindingsRows(rows);

      setSnapshot({
        loading: false,
        loadFailed: false,
        ...summary,
      });
    } catch {
      setSnapshot({
        loading: false,
        loadFailed: true,
        openFindingsLabel: "Unavailable",
        criticalAndHighLabel: "Unavailable",
        awaitingDecisionLabel: "Unavailable",
        recentlyResolvedLabel: "Unavailable",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return snapshot;
}

export { FINDINGS_HELP_READINESS_LABELS };
