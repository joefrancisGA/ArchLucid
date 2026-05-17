"use client";

import type { RunSummary } from "@/types/authority";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type StageKey = "context" | "graph" | "findings" | "manifest";

type StageDef = {
  key: StageKey;
  label: string;
  present: boolean;
  tooltip: string;
};

function stageChipLabel(stage: StageDef, buyerPolished: boolean): string {
  if (buyerPolished && stage.key === "manifest") {
    if (!stage.present) {
      return "Package · …";
    }

    return "Package finalized";
  }

  if (buyerPolished && stage.key === "graph") {
    if (!stage.present) {
      return "Evidence graph · …";
    }

    return "Evidence graph ready";
  }

  if (buyerPolished && stage.key === "findings") {
    if (!stage.present) {
      return "Risks · …";
    }

    return "Risks reviewed";
  }

  if (!stage.present) {
    return `${stage.label} · …`;
  }

  switch (stage.key) {
    case "context":
      return buyerPolished ? "Source context captured" : "Context captured";

    case "graph":
      return "Graph generated";

    case "findings":
      return "Findings reviewed";

    case "manifest":
      return "Manifest finalized";

    default:
      return `${stage.label} · ok`;
  }
}

function stagesForRun(run: RunSummary, buyerPolished: boolean): StageDef[] {
  const graphTooltip = buyerPolished
    ? "Evidence graph — structured decision trace for this review (provenance and relationships). " +
      (run.hasGraphSnapshot === true ? "Present." : "Not yet generated.")
    : "Graph — structured architecture / linkage snapshot. " +
      (run.hasGraphSnapshot === true ? "Present." : "Not yet generated.");

  const findingsTooltip = buyerPolished
    ? "Evidence-linked findings — monitored risks and decisions anchor to retrieved sources for auditability in this package. " +
      (run.hasFindingsSnapshot === true ? "Present." : "Not yet captured.")
    : "Evidence-linked findings — risks and architecture decisions traced to snapshots, artifacts, and graph relationships. " +
      (run.hasFindingsSnapshot === true ? "Present." : "Not yet captured.");

  return [
    {
      key: "context",
      label: "Context",
      present: run.hasContextSnapshot === true,
      tooltip:
        "Context — architecture inputs and constraints captured as a snapshot for this review. " +
        (run.hasContextSnapshot === true ? "Present." : "Not yet captured."),
    },
    {
      key: "graph",
      label: "Graph",
      present: run.hasGraphSnapshot === true,
      tooltip: graphTooltip,
    },
    {
      key: "findings",
      label: "Findings",
      present: run.hasFindingsSnapshot === true,
      tooltip: findingsTooltip,
    },
    {
      key: "manifest",
      label: "Manifest",
      present: run.hasGoldenManifest === true,
      tooltip:
        "Manifest — finalized reviewed manifest (golden). " +
        (run.hasGoldenManifest === true ? "Present." : "Not yet finalized."),
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
  const presentCount = stages.filter((s) => s.present).length;
  const stageCount = stages.length;

  const summaryLine =
    buyerPolished
      ? presentCount >= stageCount
        ? "Review package complete"
        : `Progress ${presentCount} of ${stageCount}`
      : `Review trail ${presentCount}/${stageCount} complete`;

  if (summaryOnly) {
    return (
      <p
        className="m-0 text-[11px] text-neutral-600 dark:text-neutral-400"
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
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  title={undefined}
                  className={cn(
                    "inline-flex cursor-help items-center rounded-full border px-2 py-px text-[10px] font-semibold uppercase tracking-wide",
                    stage.present
                      ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-50"
                      : "border-neutral-300 bg-white text-neutral-500 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-400",
                  )}
                >
                  {stageChipLabel(stage, buyerPolished)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {stage.tooltip}
              </TooltipContent>
            </Tooltip>
          </li>
        ))}
      </ul>
      <span
        className="text-[11px] text-neutral-600 dark:text-neutral-400"
        data-testid="run-provenance-inline-summary"
      >
        {summaryLine}
      </span>
    </div>
  );
}
