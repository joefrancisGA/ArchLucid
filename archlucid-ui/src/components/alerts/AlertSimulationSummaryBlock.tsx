"use client";

import { AlertSimulationOutcomeTable } from "@/components/alerts/AlertSimulationOutcomeTable";
import type { RuleSimulationResult } from "@/types/alert-simulation";

export type AlertSimulationSummaryBlockProps = {
  readonly result: RuleSimulationResult | null;
};

export function AlertSimulationSummaryBlock({
  result,
}: AlertSimulationSummaryBlockProps): React.ReactElement | null {
  if (!result) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="mb-2">Summary</h4>
      <ul className="m-0">
        <li>Evaluated reviews: {result.evaluatedRunCount}</li>
        <li>Matched: {result.matchedCount}</li>
        <li>Would create alerts: {result.wouldCreateCount}</li>
        <li>Would suppress: {result.wouldSuppressCount}</li>
      </ul>
      {result.summaryNotes?.length ? (
        <ul className="mt-2">
          {result.summaryNotes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      ) : null}
      <h4 className="mb-2 mt-4">Outcomes</h4>
      <AlertSimulationOutcomeTable outcomes={result.outcomes} />
    </div>
  );
}
