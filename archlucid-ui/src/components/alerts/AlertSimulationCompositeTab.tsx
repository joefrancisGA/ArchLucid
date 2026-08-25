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
import type { RuleSimulationResult } from "@/types/alert-simulation";
import {
  AlertSimulationRunButton,
  COND_OPS,
  METRICS,
  SEVERITIES,
  SimulationBehaviorEmpty,
} from "@/components/alerts/AlertSimulationTabShared";

export type AlertSimulationCompositeTabProps = {
  readonly canMutateEnterpriseShell: boolean;
  readonly loading: boolean;
  readonly compositeResult: RuleSimulationResult | null;
  readonly cName: string;
  readonly setCName: (value: string) => void;
  readonly cSeverity: string;
  readonly setCSeverity: (value: string) => void;
  readonly cJoin: string;
  readonly setCJoin: (value: string) => void;
  readonly cSuppression: number;
  readonly setCSuppression: (value: number) => void;
  readonly cCooldown: number;
  readonly setCCooldown: (value: number) => void;
  readonly cDedupe: string;
  readonly setCDedupe: (value: string) => void;
  readonly cRecent: number;
  readonly setCRecent: (value: number) => void;
  readonly cSlug: string;
  readonly setCSlug: (value: string) => void;
  readonly cM1: string;
  readonly setCM1: (value: string) => void;
  readonly cO1: string;
  readonly setCO1: (value: string) => void;
  readonly cV1: number;
  readonly setCV1: (value: number) => void;
  readonly cM2: string;
  readonly setCM2: (value: string) => void;
  readonly cO2: string;
  readonly setCO2: (value: string) => void;
  readonly cV2: number;
  readonly setCV2: (value: number) => void;
  readonly runComposite: () => Promise<void>;
};

export function AlertSimulationCompositeTab(props: AlertSimulationCompositeTabProps): React.ReactElement {
  return (
    <OperatorToolingWorkbenchPanels
      inputsHeadingId="sim-composite-inputs-heading"
      inputsHeading="Simulation inputs"
      behaviorHeadingId="sim-composite-behavior-heading"
      behaviorHeading={
        props.canMutateEnterpriseShell
          ? alertSimulationCurrentBehaviorHeadingOperator
          : alertSimulationCurrentBehaviorHeadingReader
      }
      inputsGridClassName="grid max-w-3xl gap-3"
      inputs={
        <>
          <div>
            <Label htmlFor="alert-simulation-composite-name">Name</Label>
            <Input
              id="alert-simulation-composite-name"
              value={props.cName}
              onChange={(e) => props.setCName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="alert-simulation-composite-severity">Severity</Label>
            <select
              id="alert-simulation-composite-severity"
              value={props.cSeverity}
              onChange={(e) => props.setCSeverity(e.target.value)}
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
            <Label htmlFor="alert-simulation-composite-join">Join</Label>
            <select
              id="alert-simulation-composite-join"
              value={props.cJoin}
              onChange={(e) => props.setCJoin(e.target.value)}
              className={ALERT_TOOLING_FORM_SELECT_CLASS}
            >
              <option value="And">All (AND)</option>
              <option value="Or">Any (OR)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="alert-simulation-composite-suppression-window">Suppression window (min)</Label>
              <Input
                id="alert-simulation-composite-suppression-window"
                type="number"
                value={props.cSuppression}
                onChange={(e) => props.setCSuppression(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert-simulation-composite-cooldown">Cooldown (min)</Label>
              <Input
                id="alert-simulation-composite-cooldown"
                type="number"
                value={props.cCooldown}
                onChange={(e) => props.setCCooldown(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="alert-simulation-composite-dedupe-scope">Dedupe scope</Label>
            <select
              id="alert-simulation-composite-dedupe-scope"
              value={props.cDedupe}
              onChange={(e) => props.setCDedupe(e.target.value)}
              className={ALERT_TOOLING_FORM_SELECT_CLASS}
            >
              <option value="RuleOnly">Rule only</option>
              <option value="RuleAndRun">Rule + review</option>
              <option value="RuleAndComparison">Rule + review + comparison</option>
            </select>
          </div>
          <p className="m-0 font-semibold">Condition 1</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="alert-simulation-composite-c1-metric">Metric</Label>
              <select
                id="alert-simulation-composite-c1-metric"
                value={props.cM1}
                onChange={(e) => props.setCM1(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                {METRICS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="alert-simulation-composite-c1-operator">Operator</Label>
              <select
                id="alert-simulation-composite-c1-operator"
                value={props.cO1}
                onChange={(e) => props.setCO1(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                {COND_OPS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="alert-simulation-composite-c1-threshold">Threshold</Label>
              <Input
                id="alert-simulation-composite-c1-threshold"
                type="number"
                value={props.cV1}
                onChange={(e) => props.setCV1(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <p className="m-0 font-semibold">Condition 2</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="alert-simulation-composite-c2-metric">Metric</Label>
              <select
                id="alert-simulation-composite-c2-metric"
                value={props.cM2}
                onChange={(e) => props.setCM2(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                {METRICS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="alert-simulation-composite-c2-operator">Operator</Label>
              <select
                id="alert-simulation-composite-c2-operator"
                value={props.cO2}
                onChange={(e) => props.setCO2(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                {COND_OPS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="alert-simulation-composite-c2-threshold">Threshold</Label>
              <Input
                id="alert-simulation-composite-c2-threshold"
                type="number"
                value={props.cV2}
                onChange={(e) => props.setCV2(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="alert-simulation-composite-recent-count">Recent review count</Label>
            <Input
              id="alert-simulation-composite-recent-count"
              type="number"
              min={1}
              max={50}
              value={props.cRecent}
              onChange={(e) => props.setCRecent(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="alert-simulation-composite-project-slug">Workspace project slug</Label>
            <Input
              id="alert-simulation-composite-project-slug"
              value={props.cSlug}
              onChange={(e) => props.setCSlug(e.target.value)}
              placeholder={ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER}
              className="mt-1"
              data-testid="alert-simulation-composite-project-slug"
            />
            <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ALERT_SIMULATION_PROJECT_SLUG_HELPER}
            </span>
          </div>
          <AlertSimulationRunButton
            testId="alert-simulation-composite-submit"
            onClick={() => void props.runComposite()}
            disabled={props.loading}
            busy={props.loading}
            label="Simulate"
          />
        </>
      }
      behavior={
        props.compositeResult ? (
          <AlertSimulationSummaryBlock result={props.compositeResult} />
        ) : (
          <SimulationBehaviorEmpty />
        )
      }
    />
  );
}
