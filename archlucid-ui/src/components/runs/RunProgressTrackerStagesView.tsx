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
};

function stageStatusTag(
  complete: boolean,
  pipelineTerminalFailure: boolean,
): { readonly kind: "ready" | "draft" | "blocked"; readonly label: string } {
  if (complete) {
    return { kind: "ready", label: "Complete" };
  }

  if (pipelineTerminalFailure) {
    return { kind: "draft", label: "Did not run" };
  }

  return { kind: "draft", label: "Pending" };
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
}: RunProgressTrackerStagesViewProps) {
  const ctxStatus = stageStatusTag(Boolean(ctx), pipelineTerminalFailure);
  const graphStatus = stageStatusTag(Boolean(graph), pipelineTerminalFailure);
  const findingsStatus = stageStatusTag(Boolean(findings), pipelineTerminalFailure);
  const manifestStatus = stageStatusTag(Boolean(manifest), pipelineTerminalFailure);

  return (
    <>
      <div className="mt-4">
        <InlineMetadataLine
          label="Progress"
          value={`${completedStages} / ${totalProgressStages} stages`}
          testId="run-progress-stage-count"
        />
      </div>

      <Separator className="my-6" />

      <ul className="m-0 flex flex-col gap-3 p-0 list-none">
        <li className="grid grid-cols-[minmax(12rem,auto)_max-content] items-center gap-2">
          <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.body)}>Source context captured</span>
          <StatusTag kind={ctxStatus.kind} label={ctxStatus.label} />
        </li>
        <li className="grid grid-cols-[minmax(12rem,auto)_max-content] items-center gap-2">
          <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.body)}>Evidence graph ready</span>
          <StatusTag kind={graphStatus.kind} label={graphStatus.label} />
        </li>
        <li className="grid grid-cols-[minmax(12rem,auto)_max-content] items-center gap-2">
          <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.body)}>Findings complete</span>
          <StatusTag kind={findingsStatus.kind} label={findingsStatus.label} />
        </li>
        {buyerAssessmentCopy ? (
          <li
            className="grid grid-cols-[minmax(12rem,auto)_max-content] items-center gap-2"
            data-testid="run-progress-signed-record-row"
          >
            <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.body)}>Finalized review record</span>
            <StatusTag
              kind={manifest ? "ready" : pipelineTerminalFailure ? "draft" : "draft"}
              label={manifest ? "Complete" : "Did not run"}
            />
          </li>
        ) : (
          <li className="grid grid-cols-[minmax(12rem,auto)_max-content] items-center gap-2">
            <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.body)}>Finalized review record ready</span>
            <StatusTag kind={manifestStatus.kind} label={manifestStatus.label} />
          </li>
        )}
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
