"use client";

import { cn } from "@/lib/utils";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import {
  ALERT_SIMULATION_BEHAVIOR_EMPTY_GETTING_STARTED,
  ALERT_SIMULATION_OUTCOMES_TABLE_EMPTY,
} from "@/lib/alert-simulation-form";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SimulatedAlertOutcome } from "@/types/alert-simulation";

export type AlertSimulationOutcomeTableProps = {
  readonly outcomes: SimulatedAlertOutcome[];
};

export function AlertSimulationOutcomeTable({
  outcomes,
}: AlertSimulationOutcomeTableProps): React.ReactElement {
  if (outcomes.length === 0) {
    return (
      <div className="grid max-w-xl gap-3">
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {ALERT_SIMULATION_OUTCOMES_TABLE_EMPTY}
        </p>
        <GettingStartedSteps {...ALERT_SIMULATION_BEHAVIOR_EMPTY_GETTING_STARTED} />
      </div>
    );
  }

  return (
    <EnterpriseTable ariaLabel="Alert simulation outcomes" className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Review ID</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Match</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Would create</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Suppressed</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Title / description</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Suppression / dedupe</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {outcomes.map((outcome, index) => (
          <EnterpriseTableRow key={`${outcome.runId ?? "x"}-${index}`}>
            <EnterpriseTableCell className="whitespace-nowrap">{outcome.runId ?? " — "}</EnterpriseTableCell>
            <EnterpriseTableCell>{outcome.ruleMatched ? "yes" : "no"}</EnterpriseTableCell>
            <EnterpriseTableCell>{outcome.wouldCreateAlert ? "yes" : "no"}</EnterpriseTableCell>
            <EnterpriseTableCell>{outcome.wouldBeSuppressed ? "yes" : "no"}</EnterpriseTableCell>
            <EnterpriseTableCell>{outcome.severity}</EnterpriseTableCell>
            <EnterpriseTableCell className="align-top">
              <strong>{outcome.title}</strong>
              <div className="mt-1 text-neutral-600 dark:text-neutral-400">{outcome.description}</div>
              {outcome.notes?.length ? (
                <ul className="mt-1.5 pl-[18px] text-neutral-600 dark:text-neutral-400">
                  {outcome.notes.map((note, noteIndex) => (
                    <li key={noteIndex}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </EnterpriseTableCell>
            <EnterpriseTableCell className={cn("align-top", OPERATOR_TYPOGRAPHY.helper)}>
              <div>
                <strong>Reason:</strong> {outcome.suppressionReason || " — "}
              </div>
              <div className="mt-1">
                <strong>Dedupe:</strong> {outcome.deduplicationKey || " — "}
              </div>
            </EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
