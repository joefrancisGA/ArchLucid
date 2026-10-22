import { cn } from "@/lib/utils";
import {
  ALERT_TUNING_RANKING_FACTORS_HEADING,
  formatAlertTuningScoreAxisLines,
} from "@/lib/alert-tuning-score-labels";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ThresholdCandidateEvaluation } from "@/types/alert-tuning";

export type AlertTuningCandidateCardProps = {
  evaluation: ThresholdCandidateEvaluation;
  highlight: boolean;
};

export function AlertTuningCandidateCard({ evaluation, highlight }: AlertTuningCandidateCardProps) {
  const { candidate, simulationResult, scoreBreakdown } = evaluation;

  return (
    <div
      className={`rounded-lg p-3 ${highlight ? "border-2 border-neutral-700 bg-neutral-50 dark:border-neutral-300 dark:bg-neutral-900" : "border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"}`}
    >
      <strong>Threshold: {candidate.thresholdValue}</strong> ({candidate.label})
      <div className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>Evaluated reviews: {simulationResult.evaluatedRunCount}</div>
        <div>Matched: {simulationResult.matchedCount}</div>
        <div>Would create: {simulationResult.wouldCreateCount}</div>
        <div>Would suppress: {simulationResult.wouldSuppressCount}</div>
      </div>
      <div className="mt-2">
        <strong>{ALERT_TUNING_RANKING_FACTORS_HEADING}</strong>
        <ul className="my-1 pl-5">
          {formatAlertTuningScoreAxisLines(scoreBreakdown).map((line) => (
            <li key={line.label}>
              {line.emphasize ? <strong>{line.label}: {line.value}</strong> : `${line.label}: ${line.value}`}
            </li>
          ))}
        </ul>
        <ul className={cn("mt-2 pl-5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {scoreBreakdown.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
