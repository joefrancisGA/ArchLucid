"use client";

import { cn } from "@/lib/utils";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { IntegrationConnectChecklist, type IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALERT_PRIORITY_OPTIONS,
  ALERT_RULE_TYPE_OPTIONS,
  describeThresholdComparison,
  type AlertRuleFormFieldErrors,
  type AlertRuleFormInput,
} from "@/lib/alert-rule-conditions";
import {
  ALERT_RULES_ALERT_PRIORITY_HELP,
  ALERT_RULES_ALERT_PRIORITY_LABEL,
  ALERT_RULES_CREATE_BLOCKED_HINT,
  ALERT_RULES_CREATE_BUTTON_LABEL,
  ALERT_RULES_CREATE_HEADING,
  ALERT_RULES_CREATE_PENDING_LABEL,
  ALERT_RULES_FORM_SECTION_ARIA_LABEL,
  ALERT_RULES_NAME_LABEL,
  ALERT_RULES_RULE_TYPE_HELP,
  ALERT_RULES_RULE_TYPE_LABEL,
} from "@/lib/alert-rule-conditions-copy";
import {
  alertRulesCreateButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_FORM_FIELD_HELPER_CLASS, OPERATOR_FORM_FIELD_STACK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";

export type AlertRulesCreateFormProps = {
  readonly canEdit: boolean;
  readonly loading: boolean;
  readonly creating: boolean;
  readonly formValid: boolean;
  readonly fieldErrors: AlertRuleFormFieldErrors;
  readonly fieldTouched: { readonly name: boolean; readonly threshold: boolean };
  readonly setFieldTouched: Dispatch<SetStateAction<{ name: boolean; threshold: boolean }>>;
  readonly name: string;
  readonly setName: Dispatch<SetStateAction<string>>;
  readonly ruleType: AlertRuleFormInput["ruleType"];
  readonly setRuleType: Dispatch<SetStateAction<AlertRuleFormInput["ruleType"]>>;
  readonly alertPriority: AlertRuleFormInput["alertPriority"];
  readonly setAlertPriority: Dispatch<SetStateAction<AlertRuleFormInput["alertPriority"]>>;
  readonly threshold: number;
  readonly setThreshold: Dispatch<SetStateAction<number>>;
  readonly thresholdStep: number;
  readonly nameInputRef: RefObject<HTMLInputElement | null>;
  readonly alertRulesCreateSteps: readonly IntegrationConnectChecklistStep[];
  readonly alertRulesCreateEmphasizedStepId: string;
  readonly mutationDisabledReason: WhyDisabledCtaReason | null;
  readonly mutationDisabledHintId: string;
  readonly onCreate: () => void;
};

export function AlertRulesCreateForm(props: AlertRulesCreateFormProps): React.JSX.Element {
  const {
    canEdit,
    loading,
    creating,
    formValid,
    fieldErrors,
    fieldTouched,
    setFieldTouched,
    name,
    setName,
    ruleType,
    setRuleType,
    alertPriority,
    setAlertPriority,
    threshold,
    setThreshold,
    thresholdStep,
    nameInputRef,
    alertRulesCreateSteps,
    alertRulesCreateEmphasizedStepId,
    mutationDisabledReason,
    mutationDisabledHintId,
    onCreate,
  } = props;

  return (
    <section aria-labelledby="alert-rules-create-heading" aria-label={ALERT_RULES_FORM_SECTION_ARIA_LABEL}>
      <h2 id="alert-rules-create-heading" className={cn("mb-3 mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {ALERT_RULES_CREATE_HEADING}
      </h2>

      {canEdit ? (
        <div className="mb-4 max-w-2xl">
          <IntegrationConnectChecklist
            title="Create checklist"
            steps={alertRulesCreateSteps}
            emphasizedStepId={alertRulesCreateEmphasizedStepId}
            testIdPrefix="alert-rules-create"
          />
        </div>
      ) : null}

      <div className="grid max-w-2xl gap-4">
        <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
          <Label htmlFor="alert-rule-name">{ALERT_RULES_NAME_LABEL}</Label>
          <Input
            ref={nameInputRef}
            id="alert-rule-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => setFieldTouched((current) => ({ ...current, name: true }))}
            disabled={!canEdit || creating}
          />
          {fieldTouched.name && fieldErrors.name ? (
            <p className={cn(OPERATOR_FORM_FIELD_HELPER_CLASS, "text-red-600 dark:text-red-400")} role="alert">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
          <Label htmlFor="alert-rule-type">{ALERT_RULES_RULE_TYPE_LABEL}</Label>
          <Select value={ruleType} onValueChange={setRuleType} disabled={!canEdit || creating}>
            <SelectTrigger
              id="alert-rule-type"
              aria-label={ALERT_RULES_RULE_TYPE_LABEL}
              data-testid="alert-rule-type-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALERT_RULE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className={cn(OPERATOR_FORM_FIELD_HELPER_CLASS, "text-al-text-secondary")}>
            {ALERT_RULES_RULE_TYPE_HELP}
          </p>
        </div>

        <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
          <Label htmlFor="alert-rule-priority">{ALERT_RULES_ALERT_PRIORITY_LABEL}</Label>
          <Select value={alertPriority} onValueChange={setAlertPriority} disabled={!canEdit || creating}>
            <SelectTrigger
              id="alert-rule-priority"
              aria-label={ALERT_RULES_ALERT_PRIORITY_LABEL}
              data-testid="alert-rule-priority-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALERT_PRIORITY_OPTIONS.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className={cn(OPERATOR_FORM_FIELD_HELPER_CLASS, "text-al-text-secondary")}>
            {ALERT_RULES_ALERT_PRIORITY_HELP}
          </p>
        </div>

        {ruleType !== "RejectedSecurityRecommendation" ? (
          <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
            <Label htmlFor="alert-rule-threshold">{describeThresholdComparison(ruleType)}</Label>
            <Input
              id="alert-rule-threshold"
              type="number"
              step={thresholdStep}
              min={1}
              value={Number.isFinite(threshold) ? threshold : ""}
              onChange={(event) => {
                const parsed = Number(event.target.value);

                if (Number.isFinite(parsed)) {
                  setThreshold(parsed);
                }
              }}
              onBlur={() => setFieldTouched((current) => ({ ...current, threshold: true }))}
              disabled={!canEdit || creating}
            />
            {fieldTouched.threshold && fieldErrors.thresholdValue ? (
              <p className={cn(OPERATOR_FORM_FIELD_HELPER_CLASS, "text-red-600 dark:text-red-400")} role="alert">
                {fieldErrors.thresholdValue}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-2">
          <div className="flex flex-col items-start gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="primary"
                onClick={onCreate}
                disabled={loading || creating || !canEdit || !formValid}
                aria-describedby={
                  canEdit ? (formValid ? undefined : "alert-rules-create-readiness") : mutationDisabledHintId
                }
                data-testid="alert-rules-create-button"
              >
                {creating
                  ? ALERT_RULES_CREATE_PENDING_LABEL
                  : canEdit
                    ? ALERT_RULES_CREATE_BUTTON_LABEL
                    : alertRulesCreateButtonLabelReaderRank}
              </Button>
              {canEdit ? <MutatingInWorkspaceChip /> : null}

              {canEdit ? (
                <WhyDisabledCtaHint
                  id="alert-rules-create-readiness"
                  testId="alert-rules-create-readiness"
                  reason={formValid ? null : whyDisabledIncompleteInput(ALERT_RULES_CREATE_BLOCKED_HINT)}
                />
              ) : null}
            </div>
            <WhyDisabledCtaHint
              id={mutationDisabledHintId}
              reason={mutationDisabledReason}
              testId="alert-rules-mutate-disabled-hint"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
