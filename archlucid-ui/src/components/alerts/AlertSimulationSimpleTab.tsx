"use client";

import { cn } from "@/lib/utils";
import { AlertSimulationSummaryBlock } from "@/components/alerts/AlertSimulationSummaryBlock";
import { OperatorToolingWorkbenchPanels } from "@/components/advisory/OperatorToolingWorkbenchPanels";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALERT_SIMULATION_COMPARED_REVIEW_DISABLED_HELPER,
  ALERT_SIMULATION_COMPARED_REVIEW_ID_HELPER,
  ALERT_SIMULATION_PROJECT_SLUG_HELPER,
  ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER,
  ALERT_SIMULATION_RECENT_COUNT_HELPER,
  ALERT_SIMULATION_RECENT_COUNT_LABEL,
  ALERT_SIMULATION_REVIEW_ID_HELPER,
  ALERT_SIMULATION_REVIEW_ID_PLACEHOLDER,
  ALERT_SIMULATION_REVIEW_ID_PRECEDENCE,
  ALERT_SIMULATION_SPECIFIC_REVIEW_REPLACES_WINDOW_NOTE,
  ALERT_TOOLING_FORM_SELECT_CLASS,
} from "@/lib/alert-simulation-form";
import {
  alertSimulationCurrentBehaviorHeadingOperator,
  alertSimulationCurrentBehaviorHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RuleSimulationResult } from "@/types/alert-simulation";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import {
  AlertSimulationRunButton,
  SEVERITIES,
  SIMPLE_RULE_TYPES,
  SimulationBehaviorEmpty,
} from "@/components/alerts/AlertSimulationTabShared";

export type AlertSimulationSimpleTabProps = {
  readonly canMutateEnterpriseShell: boolean;
  readonly loading: boolean;
  readonly simpleResult: RuleSimulationResult | null;
  readonly sName: string;
  readonly setSName: (value: string) => void;
  readonly sRuleType: string;
  readonly setSRuleType: (value: string) => void;
  readonly sSeverity: string;
  readonly setSSeverity: (value: string) => void;
  readonly sThreshold: number;
  readonly setSThreshold: (value: number) => void;
  readonly sRecent: number;
  readonly setSRecent: (value: number) => void;
  readonly sSlug: string;
  readonly setSSlug: (value: string) => void;
  readonly sRunId: string;
  readonly setSRunId: (value: string) => void;
  readonly sCompareRun: string;
  readonly setSCompareRun: (value: string) => void;
  readonly sUseHistory: boolean;
  readonly setSUseHistory: (value: boolean) => void;
  readonly setSRecentTouched: (value: boolean) => void;
  readonly setSThresholdTouched: (value: boolean) => void;
  readonly setSScopeTouched: (value: boolean) => void;
  readonly hasSpecificReviewId: boolean;
  readonly recentCountValid: boolean;
  readonly thresholdValid: boolean;
  readonly reviewScopeValid: boolean;
  readonly simpleFormValid: boolean;
  readonly sRecentTouched: boolean;
  readonly sThresholdTouched: boolean;
  readonly sScopeTouched: boolean;
  readonly simpleSimulationReadiness: WhyDisabledCtaReason | null;
  readonly runSimple: () => Promise<void>;
};

export function AlertSimulationSimpleTab(props: AlertSimulationSimpleTabProps): React.ReactElement {
  return (
    <OperatorToolingWorkbenchPanels
      inputsHeadingId="sim-simple-inputs-heading"
      inputsHeading="Simulation inputs"
      behaviorHeadingId="sim-simple-behavior-heading"
      behaviorHeading={
        props.canMutateEnterpriseShell
          ? alertSimulationCurrentBehaviorHeadingOperator
          : alertSimulationCurrentBehaviorHeadingReader
      }
      inputsGridClassName="grid max-w-[640px] gap-3"
      inputs={
        <>
          <div>
            <Label htmlFor="alert-simulation-simple-name">Name</Label>
            <Input
              id="alert-simulation-simple-name"
              value={props.sName}
              onChange={(e) => props.setSName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="alert-simulation-simple-rule-type">Rule type</Label>
            <select
              id="alert-simulation-simple-rule-type"
              value={props.sRuleType}
              onChange={(e) => props.setSRuleType(e.target.value)}
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
            <Label htmlFor="alert-simulation-simple-severity">Severity</Label>
            <select
              id="alert-simulation-simple-severity"
              value={props.sSeverity}
              onChange={(e) => props.setSSeverity(e.target.value)}
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
            <Label htmlFor="alert-simulation-simple-threshold">Threshold</Label>
            <Input
              id="alert-simulation-simple-threshold"
              type="number"
              value={Number.isNaN(props.sThreshold) ? "" : props.sThreshold}
              onChange={(e) => {
                props.setSThresholdTouched(true);
                const raw = e.target.value;

                if (raw === "") {
                  props.setSThreshold(NaN);
                  return;
                }

                props.setSThreshold(Number(raw));
              }}
              aria-invalid={props.sThresholdTouched && !props.thresholdValid}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="alert-simulation-simple-project-slug">Workspace project slug</Label>
            <Input
              id="alert-simulation-simple-project-slug"
              value={props.sSlug}
              onChange={(e) => props.setSSlug(e.target.value)}
              placeholder={ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER}
              className="mt-1"
              data-testid="alert-simulation-simple-project-slug"
            />
            <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ALERT_SIMULATION_PROJECT_SLUG_HELPER}
            </span>
          </div>
          <fieldset className="m-0 grid gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
            <legend className={cn("px-1", OPERATOR_TYPOGRAPHY.cardTitle)}>Review scope</legend>
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ALERT_SIMULATION_REVIEW_ID_PRECEDENCE}
            </p>
            <div>
              <Label htmlFor="alert-simulation-simple-review-id">Specific review ID (optional)</Label>
              <Input
                id="alert-simulation-simple-review-id"
                value={props.sRunId}
                onChange={(e) => {
                  props.setSScopeTouched(true);
                  props.setSRunId(e.target.value);
                }}
                placeholder={ALERT_SIMULATION_REVIEW_ID_PLACEHOLDER}
                className="mt-1"
                data-testid="alert-simulation-simple-review-id"
              />
              <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {ALERT_SIMULATION_REVIEW_ID_HELPER}
              </span>
            </div>
            <div>
              <Label htmlFor="alert-simulation-simple-compared-review-id">Compared-to review ID (optional)</Label>
              <Input
                id="alert-simulation-simple-compared-review-id"
                value={props.sCompareRun}
                onChange={(e) => props.setSCompareRun(e.target.value)}
                disabled={!props.hasSpecificReviewId}
                className="mt-1"
                data-testid="alert-simulation-simple-compared-review-id"
              />
              <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {props.hasSpecificReviewId
                  ? ALERT_SIMULATION_COMPARED_REVIEW_ID_HELPER
                  : ALERT_SIMULATION_COMPARED_REVIEW_DISABLED_HELPER}
              </span>
            </div>
            <div>
              <Label htmlFor="alert-simulation-simple-recent-count">{ALERT_SIMULATION_RECENT_COUNT_LABEL}</Label>
              <Input
                id="alert-simulation-simple-recent-count"
                type="number"
                min={1}
                max={50}
                value={Number.isNaN(props.sRecent) ? "" : props.sRecent}
                onChange={(e) => {
                  props.setSRecentTouched(true);
                  const raw = e.target.value;

                  if (raw === "") {
                    props.setSRecent(NaN);
                    return;
                  }

                  props.setSRecent(Number(raw));
                }}
                disabled={props.hasSpecificReviewId}
                aria-invalid={props.sRecentTouched && !props.hasSpecificReviewId && !props.recentCountValid}
                className="mt-1"
              />
              <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {ALERT_SIMULATION_RECENT_COUNT_HELPER}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="alert-simulation-simple-use-historical-window"
                checked={props.sUseHistory}
                disabled={props.hasSpecificReviewId}
                onCheckedChange={(checked) => {
                  props.setSScopeTouched(true);
                  props.setSUseHistory(checked === true);
                }}
                aria-invalid={props.sScopeTouched && !props.hasSpecificReviewId && !props.reviewScopeValid}
              />
              <Label htmlFor="alert-simulation-simple-use-historical-window">
                Use historical window (recent reviews)
              </Label>
            </div>
            {props.hasSpecificReviewId ? (
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {ALERT_SIMULATION_SPECIFIC_REVIEW_REPLACES_WINDOW_NOTE}
              </p>
            ) : null}
          </fieldset>
          <WhyDisabledCtaHint
            id="alert-simulation-simple-readiness"
            testId="alert-simulation-simple-readiness"
            reason={props.simpleFormValid ? null : props.simpleSimulationReadiness}
          />
          <AlertSimulationRunButton
            testId="alert-simulation-simple-submit"
            onClick={() => void props.runSimple()}
            disabled={props.loading || !props.simpleFormValid}
            busy={props.loading}
            label="Simulate"
            readinessHintId={props.simpleFormValid ? undefined : "alert-simulation-simple-readiness"}
          />
        </>
      }
      behavior={
        props.simpleResult ? (
          <AlertSimulationSummaryBlock result={props.simpleResult} />
        ) : (
          <SimulationBehaviorEmpty />
        )
      }
    />
  );
}
