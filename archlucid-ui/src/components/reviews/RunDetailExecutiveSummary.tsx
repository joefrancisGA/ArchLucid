import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";
import {
  formatRunDetailAwaitingActionCountDisplay,
  formatRunDetailCriticalFindingCountDisplay,
  formatRunDetailHighFindingCountDisplay,
} from "@/lib/reviews/run-detail-sponsor-finding-count-display";
import {
  RUN_DETAIL_PIPELINE_COMPLETED_LABEL,
  RUN_DETAIL_PIPELINE_COMPLETED_NOT_STORED,
} from "@/lib/reviews/run-detail-pipeline-completed-copy";
import { cn } from "@/lib/utils";

export type RunDetailSponsorReportProps = {
  readonly workspaceStatus: RunDetailWorkspaceStatus;
  readonly overallPosture: string;
  readonly highestSeverity: string | null;
  readonly hasFindingsSnapshot?: boolean;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly awaitingActionCount: number;
  readonly governanceDecisionLabel: string;
  readonly evidenceCoverageLabel: string | null;
  readonly lastEvaluatedUtc: string | null;
};

function severityTagKind(
  severity: string,
): "critical" | "high" | "medium" | "low" | null {
  if (severity === "Critical") {
    return "critical";
  }

  if (severity === "High") {
    return "high";
  }

  if (severity === "Medium") {
    return "medium";
  }

  if (severity === "Low") {
    return "low";
  }

  return null;
}

/** Single board-ready sponsor report — authoritative metrics for the overview. */
export function RunDetailSponsorReport(
  props: RunDetailSponsorReportProps,
): React.JSX.Element {
  const lastEvaluatedLabel =
    props.lastEvaluatedUtc !== null ? formatInstantForLocale(props.lastEvaluatedUtc) : null;
  const severityKind =
    props.highestSeverity !== null ? severityTagKind(props.highestSeverity) : null;

  return (
    <section
      id="review-summary"
      className="scroll-mt-24 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="run-detail-sponsor-report"
      aria-label="Sponsor report"
    >
      <h2 className={cn("m-0 mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
        Sponsor report
      </h2>
      <dl className={cn("m-0 grid gap-3 sm:grid-cols-2 xl:grid-cols-4", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Review status</dt>
          <dd className="m-0 mt-0.5">
            <StatusTag kind={props.workspaceStatus.statusTagKind} label={props.workspaceStatus.label} />
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Overall posture</dt>
          <dd className="m-0 mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
            {props.overallPosture}
          </dd>
        </div>
        {props.highestSeverity !== null && severityKind !== null ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Highest finding severity</dt>
            <dd className="m-0 mt-0.5">
              <SeverityTag
                severity={props.highestSeverity}
                kind={severityKind}
                label={props.highestSeverity}
              />
            </dd>
          </div>
        ) : (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Highest finding severity</dt>
            <dd className="m-0 mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
              Highest finding severity was not stored.
            </dd>
          </div>
        )}
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Critical findings</dt>
          <dd className="m-0 mt-0.5 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatRunDetailCriticalFindingCountDisplay(
              props.hasFindingsSnapshot,
              props.criticalCount,
            )}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">High findings</dt>
          <dd className="m-0 mt-0.5 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatRunDetailHighFindingCountDisplay(props.hasFindingsSnapshot, props.highCount)}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Findings requiring action</dt>
          <dd className="m-0 mt-0.5 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatRunDetailAwaitingActionCountDisplay(
              props.hasFindingsSnapshot,
              props.awaitingActionCount,
            )}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Approval decision</dt>
          <dd className="m-0 mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
            {props.governanceDecisionLabel}
          </dd>
        </div>
        {props.evidenceCoverageLabel !== null ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Evidence coverage</dt>
            <dd className="m-0 mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
              {props.evidenceCoverageLabel}
            </dd>
          </div>
        ) : (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Evidence coverage</dt>
            <dd className="m-0 mt-0.5 font-semibold text-neutral-900 dark:text-neutral-100">
              Evidence coverage was not stored.
            </dd>
          </div>
        )}
        {lastEvaluatedLabel !== null ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">{RUN_DETAIL_PIPELINE_COMPLETED_LABEL}</dt>
            <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">{lastEvaluatedLabel}</dd>
          </div>
        ) : (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">{RUN_DETAIL_PIPELINE_COMPLETED_LABEL}</dt>
            <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">
              {RUN_DETAIL_PIPELINE_COMPLETED_NOT_STORED}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
