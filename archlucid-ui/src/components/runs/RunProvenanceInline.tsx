"use client";

import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type StageKey = "context" | "graph" | "findings" | "manifest";

type StageDef = {
  key: StageKey;
  label: string;
  snapshot: boolean | undefined;
};

function stageNotStoredLabel(stage: StageDef): string {
  switch (stage.key) {
    case "context":
      return "Context snapshot status was not stored.";

    case "graph":
      return "Graph snapshot status was not stored.";

    case "findings":
      return "Findings snapshot status was not stored.";

    case "manifest":
      return "Package snapshot status was not stored.";

    default:
      return `${stage.label} snapshot status was not stored.`;
  }
}

function stageNotCapturedLabel(stage: StageDef, buyerPolished: boolean): string {
  if (buyerPolished && stage.key === "manifest") {
    return "Package was not captured.";
  }

  if (buyerPolished && stage.key === "graph") {
    return "Evidence graph was not captured.";
  }

  if (buyerPolished && stage.key === "findings") {
    return "Risks were not captured.";
  }

  if (buyerPolished && stage.key === "context") {
    return "Source context was not captured.";
  }

  return `${stage.label} was not captured.`;
}

function stageCapturedLabel(stage: StageDef, buyerPolished: boolean): string {
  if (buyerPolished && stage.key === "manifest") {
    return "Package finalized";
  }

  if (buyerPolished && stage.key === "graph") {
    return "Evidence graph ready";
  }

  if (buyerPolished && stage.key === "findings") {
    return "Risks reviewed";
  }

  switch (stage.key) {
    case "context":
      return buyerPolished ? "Source context captured" : "Context captured";

    case "graph":
      return "Graph generated";

    case "findings":
      return "Findings reviewed";

    case "manifest":
      return "Review finalized";

    default:
      return `${stage.label} · ok`;
  }
}

function stageChipLabel(stage: StageDef, buyerPolished: boolean): string {
  if (stage.snapshot === undefined) {
    return stageNotStoredLabel(stage);
  }

  if (stage.snapshot === false) {
    return stageNotCapturedLabel(stage, buyerPolished);
  }

  return stageCapturedLabel(stage, buyerPolished);
}

function stagesForRun(run: RunSummary, buyerPolished: boolean): StageDef[] {
  const graphPresentShowcaseFallback =
    buyerPolished === true && canonicalizeDemoRunId(run.runId) === SHOWCASE_STATIC_DEMO_RUN_ID;

  const graphSnapshot =
    run.hasGraphSnapshot === true || graphPresentShowcaseFallback === true
      ? true
      : run.hasGraphSnapshot;

  return [
    {
      key: "context",
      label: "Context",
      snapshot: run.hasContextSnapshot,
    },
    {
      key: "graph",
      label: "Graph",
      snapshot: graphSnapshot,
    },
    {
      key: "findings",
      label: "Findings",
      snapshot: run.hasFindingsSnapshot,
    },
    {
      key: "manifest",
      label: "Package",
      snapshot: run.hasGoldenManifest,
    },
  ];
}

export type RunProvenanceInlineProps = {
  run: RunSummary;
  /** Buyer walkthrough: shorter stage chips (e.g. package vs manifest). */
  buyerPolished?: boolean;
  /** Buyer list row: show progress line only (detail moves to the side panel). */
  summaryOnly?: boolean;
};

/**
 * Compact pipeline-stage strip for dense run rows (context → graph → findings → manifest) as readable pill chips.
 */
export function RunProvenanceInline({ run, buyerPolished = false, summaryOnly = false }: RunProvenanceInlineProps) {
  const stages = stagesForRun(run, buyerPolished);
  const presentCount = stages.filter((s) => s.snapshot === true).length;
  const stageCount = stages.length;

  const summaryLine =
    buyerPolished
      ? presentCount >= stageCount
        ? "Review complete"
        : `Progress ${presentCount} of ${stageCount}`
      : `Review trail ${presentCount}/${stageCount} complete`;

  if (summaryOnly) {
    return (
      <p
        className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}
        data-testid="run-provenance-inline-summary"
      >
        {summaryLine}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <ul
        className="m-0 flex list-none flex-wrap gap-1 p-0"
        aria-label="Review trail status"
        data-testid="run-provenance-inline"
      >
        {stages.map((stage) => (
          <li key={stage.key}>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-px font-semibold uppercase tracking-wide",
                OPERATOR_NAV_GROUP_LABEL,
                stage.snapshot === true
                  ? "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600 dark:bg-neutral-800/80"
                  : "border-neutral-300 bg-white text-neutral-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-400",
              )}
            >
              {stageChipLabel(stage, buyerPolished)}
            </span>
          </li>
        ))}
      </ul>
      <span
        className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}
        data-testid="run-provenance-inline-summary"
      >
        {summaryLine}
      </span>
    </div>
  );
}
