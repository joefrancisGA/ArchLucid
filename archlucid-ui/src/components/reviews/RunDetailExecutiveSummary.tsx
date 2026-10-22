import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";
import { cn } from "@/lib/utils";

export type RunDetailSponsorReportProps = {
  readonly workspaceStatus: RunDetailWorkspaceStatus;
  readonly overallPosture: string;
  readonly highestSeverity: string | null;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly awaitingActionCount: number;
  readonly governanceDecisionLabel: string;
  readonly evidenceCoverageLabel: string | null;
  readonly lastEvaluatedUtc: string | null;
};

function severityTagKind(
  severity: string,
): "critical" | "high" | "medium" | "low" {
  if (severity === "Critical") {
    return "critical";
  }

  if (severity === "High") {
    return "high";
  }

  if (severity === "Medium") {
    return "medium";
  }

  return "low";
}

/** Single board-ready sponsor report — authoritative metrics for the overview. */
export function RunDetailSponsorReport(
  props: RunDetailSponsorReportProps,
): React.JSX.Element {
  const lastEvaluatedLabel =
    props.lastEvaluatedUtc !== null ? formatInstantForLocale(props.lastEvaluatedUtc) : null;

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
        {props.highestSeverity !== null ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Highest finding severity</dt>
            <dd className="m-0 mt-0.5">
              <SeverityTag
                severity={props.highestSeverity}
                kind={severityTagKind(props.highestSeverity)}
                label={props.highestSeverity}
              />
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Critical findings</dt>
          <dd className="m-0 mt-0.5 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {props.criticalCount === 0 ? "None" : props.criticalCount}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">High findings</dt>
          <dd className="m-0 mt-0.5 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {props.highCount === 0 ? "None" : props.highCount}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Findings requiring action</dt>
          <dd className="m-0 mt-0.5 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {props.awaitingActionCount}
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
        ) : null}
        {lastEvaluatedLabel !== null ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Last evaluated</dt>
            <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">{lastEvaluatedLabel}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
