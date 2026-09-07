import { cn } from "@/lib/utils";

import { InlineMetadataLine } from "@/components/InlineMetadataLine";
import { Separator } from "@/components/ui/separator";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatStageDurationMs } from "@/lib/format-stage-duration";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { buyerPipelineStageName } from "@/lib/pipeline-stage-buyer-labels";

import type { RunProgressTrackerViewModel } from "./use-run-progress-tracker";

type RunProgressTrackerStagesViewProps = Pick<
  RunProgressTrackerViewModel,
  | "buyerAssessmentCopy"
  | "pipelineJobLabel"
  | "completedStages"
  | "totalProgressStages"
  | "ctx"
  | "graph"
  | "findings"
  | "manifest"
  | "stageTimeline"
  | "activeSummary"
> & {
  readonly pipelineTerminalFailure?: boolean;
  readonly suppressIntakeDescription?: boolean;
  readonly suppressStageCountLine?: boolean;
};

type StageRow = {
  readonly key: string;
  readonly label: string;
  readonly complete: boolean;
};

function stageStatusTag(
  complete: boolean,
  pipelineTerminalFailure: boolean,
  isFailureBoundary: boolean,
): { readonly kind: "ready" | "draft" | "blocked"; readonly label: string } {
  if (complete) {
    return { kind: "ready", label: "Complete" };
  }

  if (pipelineTerminalFailure) {
    return {
      kind: "blocked",
      label: isFailureBoundary ? "Stopped here" : "Did not run",
    };
  }

  return { kind: "draft", label: "Pending" };
}

function resolveFailureBoundaryStageKey(stages: readonly StageRow[]): string | null {
  for (const stage of stages) {
    if (!stage.complete) {
      return stage.key;
    }
  }

  return null;
}

export function RunProgressTrackerStagesView({
  buyerAssessmentCopy,
  pipelineJobLabel,
  completedStages,
  totalProgressStages,
  ctx,
  graph,
  findings,
  manifest,
  stageTimeline,
  activeSummary,
  pipelineTerminalFailure = false,
  suppressIntakeDescription = false,
  suppressStageCountLine = false,
}: RunProgressTrackerStagesViewProps) {
  const stageRows: StageRow[] = [
    { key: "ctx", label: "Source context captured", complete: Boolean(ctx) },
    { key: "graph", label: "Evidence graph ready", complete: Boolean(graph) },
    { key: "findings", label: "Findings complete", complete: Boolean(findings) },
    {
      key: "manifest",
      label: buyerAssessmentCopy ? "Finalized review record" : "Finalized review record ready",
      complete: Boolean(manifest),
    },
  ];
  const failureBoundaryStageKey = pipelineTerminalFailure
    ? resolveFailureBoundaryStageKey(stageRows)
    : null;

  return (
    <>
      {!suppressStageCountLine ? (
        <div className="mt-4">
          <InlineMetadataLine
            label="Progress"
            value={`${completedStages} / ${totalProgressStages} stages`}
            testId="run-progress-stage-count"
          />
        </div>
      ) : null}

      <Separator className="my-6" />

      <ul className="m-0 flex flex-col gap-3 p-0 list-none">
        {stageRows.map((stage) => {
          const status = stageStatusTag(
            stage.complete,
            pipelineTerminalFailure,
            failureBoundaryStageKey === stage.key,
          );

          return (
            <li
              key={stage.key}
              className="grid grid-cols-[minmax(12rem,auto)_max-content] items-center gap-2"
              data-testid={stage.key === "manifest" ? "run-progress-signed-record-row" : undefined}
            >
              <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.body)}>{stage.label}</span>
              <StatusTag kind={status.kind} label={status.label} />
            </li>
          );
        })}
      </ul>

      {buyerAssessmentCopy && stageTimeline.length > 0 ? (
        <div className="mt-6" data-testid="run-progress-stage-timeline-table">
          <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Stage timing</h4>
          <EnterpriseTable ariaLabel="Assessment stage timing" className="mt-3">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Stage</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Started</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Completed</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Duration</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {stageTimeline.map((stage) => (
                <EnterpriseTableRow key={stage.stageName}>
                  <EnterpriseTableCell>{buyerPipelineStageName(stage.stageName, true)}</EnterpriseTableCell>
                  <EnterpriseTableCell>{formatInstantForLocale(stage.startedUtc)}</EnterpriseTableCell>
                  <EnterpriseTableCell>{formatInstantForLocale(stage.completedUtc)}</EnterpriseTableCell>
                  <EnterpriseTableCell>{formatStageDurationMs(stage.durationMs ?? null)}</EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </div>
      ) : null}

      {!suppressIntakeDescription && activeSummary?.description ? (
        <p className={cn("mt-4 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{activeSummary.description}</p>
      ) : null}
    </>
  );
}
