"use client";

import { cn } from "@/lib/utils";
import { AlertSimulationSummaryBlock } from "@/components/alerts/AlertSimulationSummaryBlock";
import { OperatorToolingWorkbenchPanels } from "@/components/advisory/OperatorToolingWorkbenchPanels";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALERT_SIMULATION_PROJECT_SLUG_HELPER,
  ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER,
  ALERT_TOOLING_FORM_SELECT_CLASS,
} from "@/lib/alert-simulation-form";
import {
  alertSimulationCurrentBehaviorHeadingOperator,
  alertSimulationCurrentBehaviorHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RuleCandidateComparisonResult } from "@/types/alert-simulation";
import {
  AlertSimulationRunButton,
  SEVERITIES,
  SIMPLE_RULE_TYPES,
  SimulationBehaviorEmpty,
} from "@/components/alerts/AlertSimulationTabShared";

export type AlertSimulationCompareTabProps = {
  readonly canMutateEnterpriseShell: boolean;
  readonly loading: boolean;
  readonly compareResult: RuleCandidateComparisonResult | null;
  readonly cmpName: string;
  readonly setCmpName: (value: string) => void;
  readonly cmpRuleType: string;
  readonly setCmpRuleType: (value: string) => void;
  readonly cmpSeverity: string;
  readonly setCmpSeverity: (value: string) => void;
  readonly cmpA: number;
  readonly setCmpA: (value: number) => void;
  readonly cmpB: number;
  readonly setCmpB: (value: number) => void;
  readonly cmpRecent: number;
  readonly setCmpRecent: (value: number) => void;
  readonly cmpSlug: string;
  readonly setCmpSlug: (value: string) => void;
  readonly runCompare: () => Promise<void>;
};

export function AlertSimulationCompareTab(props: AlertSimulationCompareTabProps): React.ReactElement {
  return (
    <OperatorToolingWorkbenchPanels
      inputsHeadingId="sim-compare-inputs-heading"
      inputsHeading="Simulation inputs"
      behaviorHeadingId="sim-compare-behavior-heading"
      behaviorHeading={
        props.canMutateEnterpriseShell
          ? alertSimulationCurrentBehaviorHeadingOperator
          : alertSimulationCurrentBehaviorHeadingReader
      }
      inputsGridClassName="grid max-w-[640px] gap-3"
      inputs={
        <>
          <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Same rule type and severity; only thresholds differ. Useful for tuning (e.g. 10 vs 20).
          </p>
          <div>
            <Label htmlFor="alert-simulation-compare-name">Name</Label>
            <Input
              id="alert-simulation-compare-name"
              value={props.cmpName}
              onChange={(e) => props.setCmpName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="alert-simulation-compare-rule-type">Rule type</Label>
            <select
              id="alert-simulation-compare-rule-type"
              value={props.cmpRuleType}
              onChange={(e) => props.setCmpRuleType(e.target.value)}
              className={ALERT_TOOLING_FORM_SELECT_CLASS}
            >
              {SIMPLE_RULE_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="alert-simulation-compare-severity">Severity</Label>
            <select
              id="alert-simulation-compare-severity"
              value={props.cmpSeverity}
              onChange={(e) => props.setCmpSeverity(e.target.value)}
              className={ALERT_TOOLING_FORM_SELECT_CLASS}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="alert-simulation-compare-threshold-a">Candidate A threshold</Label>
            <Input
              id="alert-simulation-compare-threshold-a"
              type="number"
              value={props.cmpA}
              onChange={(e) => props.setCmpA(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="alert-simulation-compare-threshold-b">Candidate B threshold</Label>
            <Input
              id="alert-simulation-compare-threshold-b"
              type="number"
              value={props.cmpB}
              onChange={(e) => props.setCmpB(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="alert-simulation-compare-recent-count">Recent review count</Label>
            <Input
              id="alert-simulation-compare-recent-count"
              type="number"
              min={1}
              max={50}
              value={props.cmpRecent}
              onChange={(e) => props.setCmpRecent(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="alert-simulation-compare-project-slug">Workspace project slug</Label>
            <Input
              id="alert-simulation-compare-project-slug"
              value={props.cmpSlug}
              onChange={(e) => props.setCmpSlug(e.target.value)}
              placeholder={ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER}
              className="mt-1"
              data-testid="alert-simulation-compare-project-slug"
            />
            <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ALERT_SIMULATION_PROJECT_SLUG_HELPER}
            </span>
          </div>
          <AlertSimulationRunButton
            testId="alert-simulation-compare-submit"
            onClick={() => void props.runCompare()}
            disabled={props.loading}
            busy={props.loading}
            label="Compare candidates"
          />
        </>
      }
      behavior={
        props.compareResult ? (
          <div className="mt-2">
            <h4 className="mb-2">Comparison notes</h4>
            <ul>
              {props.compareResult.summaryNotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            <h4 className="mb-2 mt-4">Candidate A</h4>
            <AlertSimulationSummaryBlock result={props.compareResult.candidateA} />
            <h4 className="mb-2 mt-4">Candidate B</h4>
            <AlertSimulationSummaryBlock result={props.compareResult.candidateB} />
          </div>
        ) : (
          <SimulationBehaviorEmpty />
        )
      }
    />
  );
}
