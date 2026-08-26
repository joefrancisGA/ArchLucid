"use client";

import { cn } from "@/lib/utils";
import type { Dispatch, SetStateAction } from "react";

import { IntegrationConnectChecklist, type IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  COMPOSITE_ALERT_CONDITION_OPERATOR_OPTIONS,
  COMPOSITE_ALERT_DEDUPE_SCOPE_OPTIONS,
  COMPOSITE_ALERT_JOIN_OPERATOR_OPTIONS,
  COMPOSITE_ALERT_METRIC_OPTIONS,
} from "@/lib/composite-alert-rules-labels";
import {
  COMPOSITE_ALERT_RULE_NAME_PLACEHOLDER,
  type CompositeAlertRuleFormFieldErrors,
} from "@/lib/composite-alert-rules-form";
import {
  alertToolingChangeConfigurationHeadingOperator,
  alertToolingChangeConfigurationHeadingReader,
  alertToolingConfigureSectionSubline,
  compositeRulesCreateButtonLabelOperator,
  compositeRulesCreateButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const SEVERITIES = ["Info", "Warning", "High", "Critical"];

const COMPOSITE_RULE_SELECT_CLASS =
  "mt-1 block w-full rounded-md border border-neutral-300 bg-white p-2 dark:border-neutral-600 dark:bg-neutral-950";

export type CompositeAlertRulesCreateFormProps = {
  readonly canMutateComposite: boolean;
  readonly loading: boolean;
  readonly formValid: boolean;
  readonly submitAttempted: boolean;
  readonly fieldErrors: CompositeAlertRuleFormFieldErrors;
  readonly mutationDisabledReason: string | null;
  readonly mutationDisabledHintId: string;
  readonly compositeCreateSteps: readonly IntegrationConnectChecklistStep[];
  readonly compositeCreateEmphasizedStepId: string;
  readonly name: string;
  readonly setName: Dispatch<SetStateAction<string>>;
  readonly severity: string;
  readonly setSeverity: Dispatch<SetStateAction<string>>;
  readonly joinOperator: string;
  readonly setJoinOperator: Dispatch<SetStateAction<string>>;
  readonly suppressionWindowMinutes: number;
  readonly setSuppressionWindowMinutes: Dispatch<SetStateAction<number>>;
  readonly cooldownMinutes: number;
  readonly setCooldownMinutes: Dispatch<SetStateAction<number>>;
  readonly dedupeScope: string;
  readonly setDedupeScope: Dispatch<SetStateAction<string>>;
  readonly m1: string;
  readonly setM1: Dispatch<SetStateAction<string>>;
  readonly o1: string;
  readonly setO1: Dispatch<SetStateAction<string>>;
  readonly v1: number;
  readonly setV1: Dispatch<SetStateAction<number>>;
  readonly m2: string;
  readonly setM2: Dispatch<SetStateAction<string>>;
  readonly o2: string;
  readonly setO2: Dispatch<SetStateAction<string>>;
  readonly v2: number;
  readonly setV2: Dispatch<SetStateAction<number>>;
  readonly onRequestCreate: () => void;
};

export function CompositeAlertRulesCreateForm(props: CompositeAlertRulesCreateFormProps): React.JSX.Element {
  const {
    canMutateComposite,
    loading,
    formValid,
    submitAttempted,
    fieldErrors,
    mutationDisabledReason,
    mutationDisabledHintId,
    compositeCreateSteps,
    compositeCreateEmphasizedStepId,
    name,
    setName,
    severity,
    setSeverity,
    joinOperator,
    setJoinOperator,
    suppressionWindowMinutes,
    setSuppressionWindowMinutes,
    cooldownMinutes,
    setCooldownMinutes,
    dedupeScope,
    setDedupeScope,
    m1,
    setM1,
    o1,
    setO1,
    v1,
    setV1,
    m2,
    setM2,
    o2,
    setO2,
    v2,
    setV2,
    onRequestCreate,
  } = props;

  return (
    <section
      className={cn("min-w-0", !canMutateComposite && "opacity-90")}
      aria-labelledby="composite-rules-change-heading"
    >
      <h3 id="composite-rules-change-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
        {canMutateComposite
          ? alertToolingChangeConfigurationHeadingOperator
          : alertToolingChangeConfigurationHeadingReader}
      </h3>
      <p className={cn("mb-2.5 mt-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {alertToolingConfigureSectionSubline}
      </p>
      <WhyDisabledCtaHint
        id={mutationDisabledHintId}
        reason={mutationDisabledReason}
        testId="composite-rules-mutate-disabled-hint"
      />
      {canMutateComposite ? (
        <div className="mb-4 max-w-2xl">
          <IntegrationConnectChecklist
            title="Create checklist"
            steps={compositeCreateSteps}
            emphasizedStepId={compositeCreateEmphasizedStepId}
            testIdPrefix="composite-alert-rules-create"
          />
        </div>
      ) : null}
      <fieldset
        disabled={!canMutateComposite}
        aria-label="New composite rule form"
        className="m-0 border-none p-0"
      >
        <div className="mb-7 grid max-w-3xl gap-4">
          <div>
            <Label htmlFor="composite-rule-name">Name</Label>
            <Input
              id="composite-rule-name"
              value={name}
              placeholder={COMPOSITE_ALERT_RULE_NAME_PLACEHOLDER}
              onChange={(event) => setName(event.target.value)}
              className="mt-1"
              aria-invalid={submitAttempted && fieldErrors.name !== undefined}
              aria-describedby={submitAttempted && fieldErrors.name ? "composite-rule-name-error" : undefined}
            />
            {submitAttempted && fieldErrors.name ? (
              <p id="composite-rule-name-error" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>
                {fieldErrors.name}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="composite-rule-severity">Severity when fired</Label>
            <select
              id="composite-rule-severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              className={COMPOSITE_RULE_SELECT_CLASS}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="composite-rule-join-operator">Combine conditions</Label>
            <select
              id="composite-rule-join-operator"
              value={joinOperator}
              onChange={(event) => setJoinOperator(event.target.value)}
              className={COMPOSITE_RULE_SELECT_CLASS}
            >
              {COMPOSITE_ALERT_JOIN_OPERATOR_OPTIONS.map((j) => (
                <option key={j.value} value={j.value}>
                  {j.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="rounded-lg border border-neutral-300 p-3 dark:border-neutral-600">
            <legend>Condition 1</legend>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="composite-rule-m1-metric">Metric</Label>
                <select
                  id="composite-rule-m1-metric"
                  value={m1}
                  onChange={(event) => setM1(event.target.value)}
                  className={COMPOSITE_RULE_SELECT_CLASS}
                >
                  {COMPOSITE_ALERT_METRIC_OPTIONS.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="composite-rule-m1-operator">Operator</Label>
                <select
                  id="composite-rule-m1-operator"
                  value={o1}
                  onChange={(event) => setO1(event.target.value)}
                  className={COMPOSITE_RULE_SELECT_CLASS}
                  aria-label="Operator"
                >
                  {COMPOSITE_ALERT_CONDITION_OPERATOR_OPTIONS.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="composite-rule-m1-threshold">Threshold value</Label>
                <Input
                  id="composite-rule-m1-threshold"
                  type="number"
                  step="any"
                  value={v1}
                  onChange={(event) => setV1(Number(event.target.value))}
                  className="mt-1"
                  aria-invalid={submitAttempted && fieldErrors.threshold1 !== undefined}
                  aria-describedby={submitAttempted && fieldErrors.threshold1 ? "composite-rule-m1-threshold-error" : undefined}
                />
                {submitAttempted && fieldErrors.threshold1 ? (
                  <p id="composite-rule-m1-threshold-error" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {fieldErrors.threshold1}
                  </p>
                ) : null}
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-neutral-300 p-3 dark:border-neutral-600">
            <legend>Condition 2</legend>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="composite-rule-m2-metric">Metric</Label>
                <select
                  id="composite-rule-m2-metric"
                  value={m2}
                  onChange={(event) => setM2(event.target.value)}
                  className={COMPOSITE_RULE_SELECT_CLASS}
                  aria-invalid={submitAttempted && fieldErrors.metrics !== undefined}
                  aria-describedby={
                    submitAttempted && fieldErrors.metrics ? "composite-rule-metrics-error" : undefined
                  }
                >
                  {COMPOSITE_ALERT_METRIC_OPTIONS.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="composite-rule-m2-operator">Operator</Label>
                <select
                  id="composite-rule-m2-operator"
                  value={o2}
                  onChange={(event) => setO2(event.target.value)}
                  className={COMPOSITE_RULE_SELECT_CLASS}
                  aria-label="Operator"
                >
                  {COMPOSITE_ALERT_CONDITION_OPERATOR_OPTIONS.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="composite-rule-m2-threshold">Threshold value</Label>
                <Input
                  id="composite-rule-m2-threshold"
                  type="number"
                  step="any"
                  value={v2}
                  onChange={(event) => setV2(Number(event.target.value))}
                  className="mt-1"
                  aria-invalid={submitAttempted && fieldErrors.threshold2 !== undefined}
                  aria-describedby={submitAttempted && fieldErrors.threshold2 ? "composite-rule-m2-threshold-error" : undefined}
                />
                {submitAttempted && fieldErrors.threshold2 ? (
                  <p id="composite-rule-m2-threshold-error" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {fieldErrors.threshold2}
                  </p>
                ) : null}
              </div>
            </div>
            {submitAttempted && fieldErrors.metrics ? (
              <p id="composite-rule-metrics-error" className={cn("mt-2 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>
                {fieldErrors.metrics}
              </p>
            ) : null}
          </fieldset>

          <div>
            <Label htmlFor="composite-rule-suppression-minutes">Suppression window (minutes)</Label>
            <Input
              id="composite-rule-suppression-minutes"
              type="number"
              value={suppressionWindowMinutes}
              onChange={(event) => setSuppressionWindowMinutes(Number(event.target.value))}
              className="mt-1"
              aria-invalid={submitAttempted && fieldErrors.suppressionWindowMinutes !== undefined}
              aria-describedby={
                submitAttempted && fieldErrors.suppressionWindowMinutes
                  ? "composite-rule-suppression-minutes-error"
                  : undefined
              }
            />
            {submitAttempted && fieldErrors.suppressionWindowMinutes ? (
              <p
                id="composite-rule-suppression-minutes-error"
                className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}
              >
                {fieldErrors.suppressionWindowMinutes}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="composite-rule-cooldown-minutes">Cooldown (minutes)</Label>
            <Input
              id="composite-rule-cooldown-minutes"
              type="number"
              value={cooldownMinutes}
              onChange={(event) => setCooldownMinutes(Number(event.target.value))}
              className="mt-1"
              aria-invalid={submitAttempted && fieldErrors.cooldownMinutes !== undefined}
              aria-describedby={
                submitAttempted && fieldErrors.cooldownMinutes ? "composite-rule-cooldown-minutes-error" : undefined
              }
            />
            {submitAttempted && fieldErrors.cooldownMinutes ? (
              <p
                id="composite-rule-cooldown-minutes-error"
                className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}
              >
                {fieldErrors.cooldownMinutes}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="composite-rule-dedupe-scope">Dedupe scope</Label>
            <select
              id="composite-rule-dedupe-scope"
              value={dedupeScope}
              onChange={(event) => setDedupeScope(event.target.value)}
              className={COMPOSITE_RULE_SELECT_CLASS}
            >
              {COMPOSITE_ALERT_DEDUPE_SCOPE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="primary"
            data-testid="composite-rules-create-button"
            onClick={onRequestCreate}
            disabled={loading || !canMutateComposite || !formValid}
            aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
          >
            {canMutateComposite ? compositeRulesCreateButtonLabelOperator : compositeRulesCreateButtonLabelReaderRank}
          </Button>
        </div>
      </fieldset>
    </section>
  );
}
