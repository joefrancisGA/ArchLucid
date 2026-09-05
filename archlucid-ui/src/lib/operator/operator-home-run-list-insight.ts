import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import { formatAbsoluteUpdatedAtTitle, formatRelativeTime } from "@/lib/relative-time";
import { SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

function clampNonNegativeInt(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.trunc(value));
}

export function resolveRunFindingCountDisplay(run: RunSummary): number | null {
  const fromRun = clampNonNegativeInt(run.findingCount);

  if (fromRun !== null) {
    return fromRun;
  }

  if (isShowcaseStaticDemoRunId(run.runId ?? "")) {
    return SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount;
  }

  return null;
}

export function resolveRunWarningCountDisplay(run: RunSummary): number | null {
  const fromRun = clampNonNegativeInt(run.warningCount);

  if (fromRun !== null) {
    return fromRun;
  }

  if (isShowcaseStaticDemoRunId(run.runId ?? "")) {
    return SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount;
  }

  return null;
}

export type RunHomeListUpdatedPresentation = {
  readonly relativeLabel: string;
  readonly absoluteLabel: string;
  readonly isoUtc: string;
};

export function formatRunHomeListUpdatedLabel(run: RunSummary): RunHomeListUpdatedPresentation | null {
  const createdUtc = run.createdUtc?.trim() ?? "";

  if (createdUtc.length === 0) {
    return null;
  }

  return {
    isoUtc: createdUtc,
    relativeLabel: formatRelativeTime(createdUtc),
    absoluteLabel: formatAbsoluteUpdatedAtTitle(createdUtc),
  };
}

export function formatRunHomeListInsightLine(run: RunSummary): string | null {
  const findings = resolveRunFindingCountDisplay(run);
  const warnings = resolveRunWarningCountDisplay(run);

  if (run.hasGoldenManifest === true) {
    if (findings !== null && warnings !== null && warnings > 0) {
      return `${findings} finding${findings === 1 ? "" : "s"} · ${warnings} monitored risk${warnings === 1 ? "" : "s"} · package finalized`;
    }

    if (findings !== null) {
      const withFindings = `${findings} finding${findings === 1 ? "" : "s"} · package finalized`;

      if (run.hasGovernanceWarnings === true) {
        return `${withFindings} · monitoring active`;
      }

      return withFindings;
    }

    if (run.hasGovernanceWarnings === true) {
      return "Package finalized · monitoring active";
    }

    return "Package finalized";
  }

  if (run.hasFindingsSnapshot === true) {
    if (findings !== null) {
      return `${findings} finding${findings === 1 ? "" : "s"} ready · finalize this review to lock export readiness`;
    }

    return "Findings ready · finalize this review to lock export readiness";
  }

  if (findings !== null) {
    return `${findings} finding${findings === 1 ? "" : "s"} in progress`;
  }

  return null;
}
