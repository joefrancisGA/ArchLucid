import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

export type DemoPreviewAtAGlanceMetrics = {
  readonly status: string;
  readonly overallAssessment: string;
  readonly policyPack: string;
  readonly decisions: string;
  readonly monitoredRisks: string;
  readonly unresolvedIssues: string;
  readonly reviewDuration: string;
  readonly deliverablesProduced: string;
  readonly conclusion: string;
};

function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return String(value);
}

function parseUtc(value: string): number | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Date.parse(trimmed);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/** Computes review duration from timeline bounds when dates are reliable. */
export function computeDemoReviewDurationLabel(
  timeline: DemoCommitPagePreviewResponse["pipelineTimeline"],
  runCreatedUtc: string,
): string {
  const ordered = [...timeline]
    .map((event) => event.occurredUtc)
    .map(parseUtc)
    .filter((value): value is number => value !== null)
    .sort((left, right) => left - right);

  const start = ordered[0] ?? parseUtc(runCreatedUtc);
  const end = ordered.length > 0 ? ordered[ordered.length - 1] : null;

  if (start === null || end === null || end < start) {
    return "—";
  }

  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.round((end - start) / dayMs));

  return days === 1 ? "1 day" : `${days} days`;
}

export function buildDemoPreviewAtAGlanceMetrics(payload: DemoCommitPagePreviewResponse): DemoPreviewAtAGlanceMetrics {
  const manifest = payload.manifest;
  const runExplanation = payload.runExplanation;
  const artifacts = Array.isArray(payload.artifacts) ? payload.artifacts : [];

  return {
    status: manifest ? manifestStatusForDisplay(manifest.status) : "—",
    overallAssessment: runExplanation?.overallAssessment?.trim() ?? "—",
    policyPack: manifest
      ? policyPackBuyerLabel(manifest.ruleSetId ?? "", manifest.ruleSetVersion ?? "")
      : "—",
    decisions: manifest ? formatCount(manifest.decisionCount) : formatCount(runExplanation?.decisionCount),
    monitoredRisks: manifest ? formatCount(manifest.warningCount) : "—",
    unresolvedIssues: manifest
      ? formatCount(manifest.unresolvedIssueCount)
      : formatCount(runExplanation?.unresolvedIssueCount),
    reviewDuration: computeDemoReviewDurationLabel(
      Array.isArray(payload.pipelineTimeline) ? payload.pipelineTimeline : [],
      payload.run?.createdUtc ?? "",
    ),
    deliverablesProduced: formatCount(artifacts.length),
    conclusion: runExplanation?.overallAssessment?.trim() ?? "",
  };
}

export function buildDemoPreviewConditionsText(themeSummaries: readonly string[] | undefined): string {
  const themes = Array.isArray(themeSummaries)
    ? themeSummaries.map((theme) => theme.trim()).filter((theme) => theme.length > 0)
    : [];

  if (themes.length === 0) {
    return "Continue monitoring identified control themes through delivery and operations.";
  }

  return `Continue monitoring ${themes.join(", ").toLowerCase()}.`;
}
