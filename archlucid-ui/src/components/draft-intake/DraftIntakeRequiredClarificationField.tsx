"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

import { IntakeFieldLabel } from "@/components/intake/IntakeFieldLabel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusTag } from "@/components/ui/status-tag";
import { Textarea } from "@/components/ui/textarea";
import {
  GUIDED_INTAKE_CLOUD_TARGET_CONTROL_HINT,
  GUIDED_INTAKE_SAVE_AND_CONTINUE_LABEL,
  GUIDED_INTAKE_SAVE_ANSWER_LABEL,
} from "@/lib/guided-intake-copy";
import { CLOUD_TARGET_QUESTION_KEY } from "@/lib/architecture/architecture-creation-question-definition";
import { UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER } from "@/lib/universal-intake-answer-inference";
import type { DraftElicitationQuestion } from "@/types/draft-intake";

export { CLOUD_TARGET_QUESTION_KEY };

export const REQUIRED_CLARIFICATION_BASELINE_LABEL = "Required for baseline review";

const CLOUD_TARGET_OPTIONS = [
  { value: "None", label: "Cloud-neutral (no specific provider)" },
  { value: "Azure", label: "Microsoft Azure" },
  { value: "Aws", label: "Amazon Web Services (AWS)" },
  { value: "Gcp", label: "Google Cloud (GCP)" },
] as const;

export type ClarificationCardStatus = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export type DraftIntakeRequiredClarificationFieldProps = {
  readonly question: DraftElicitationQuestion;
  readonly answer: string;
  readonly busy: boolean;
  readonly clarificationIndex: number;
  readonly clarificationTotal: number;
  readonly isPrimary?: boolean;
  readonly isFocused?: boolean;
  readonly compactActions?: boolean;
  readonly showAllMode?: boolean;
  readonly showBaselineLabel?: boolean;
  readonly canSaveAndContinue?: boolean;
  readonly clarificationStatus?: ClarificationCardStatus;
  readonly isSuggested?: boolean;
  readonly showRequirednessSuffix?: boolean;
  readonly onAnswerChange: (questionKey: string, value: string) => void;
  readonly onSaveAndContinue: (questionKey: string) => void;
  readonly onSkip: (questionKey: string) => void;
};

function clarificationControlId(questionKey: string): string {
  return `socratic-clarification-${questionKey.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
}

/** Single required-clarification prompt; answers persist when the operator reviews. */
export function DraftIntakeRequiredClarificationField(
  props: DraftIntakeRequiredClarificationFieldProps,
) {
  const actionSize = props.compactActions === true ? "sm" : "default";
  const isPrimary = props.isPrimary !== false;
  const isFocused = props.isFocused === true || isPrimary;
  const isCloudTargetQuestion = props.question.questionKey === CLOUD_TARGET_QUESTION_KEY;
  const showAllMode = props.showAllMode === true;
  const controlId = clarificationControlId(props.question.questionKey);
  const labelId = `${controlId}-label`;
  const saveLabel = showAllMode ? GUIDED_INTAKE_SAVE_ANSWER_LABEL : GUIDED_INTAKE_SAVE_AND_CONTINUE_LABEL;

  return (
    <fieldset
      className={cn(
        "space-y-3 rounded-md border p-3",
        isFocused
          ? "border-l-[3px] border-l-neutral-700 border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:border-l-neutral-400 dark:bg-neutral-950"
          : "border-neutral-200 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/30",
      )}
      aria-labelledby={labelId}
      data-testid="socratic-question"
      data-question-key={props.question.questionKey}
      data-question-primary={isPrimary ? "true" : "false"}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p
          className={cn(
            "m-0 font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          data-testid="socratic-question-progress"
        >
          Required clarification {props.clarificationIndex} of {props.clarificationTotal}
        </p>
        {props.clarificationStatus !== undefined ? (
          <StatusTag
            kind={props.clarificationStatus.kind}
            label={props.clarificationStatus.label}
            data-testid="socratic-question-status"
          />
        ) : null}
      </div>
      {props.showBaselineLabel !== false ? (
        <p
          className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="socratic-question-baseline-label"
        >
          {REQUIRED_CLARIFICATION_BASELINE_LABEL}
        </p>
      ) : null}
      <IntakeFieldLabel
        htmlFor={labelId}
        label={props.question.prompt}
        required
        asLegend
        showRequirednessSuffix={props.showRequirednessSuffix}
      />
      {props.isSuggested === true ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="socratic-question-suggested-hint"
        >
          {UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER}
        </p>
      ) : null}
      {isCloudTargetQuestion ? (
        <>
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="socratic-cloud-target-control-hint"
          >
            {GUIDED_INTAKE_CLOUD_TARGET_CONTROL_HINT}
          </p>
          <Select
            value={props.answer.length > 0 ? props.answer : undefined}
            onValueChange={(value) => {
              props.onAnswerChange(props.question.questionKey, value);
            }}
            disabled={props.busy}
          >
            <SelectTrigger
              id={controlId}
              aria-labelledby={labelId}
              aria-required
              data-testid="socratic-cloud-target-select"
            >
              <SelectValue placeholder="Select a cloud provider or cloud-neutral" />
            </SelectTrigger>
            <SelectContent>
              {CLOUD_TARGET_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  data-testid={`socratic-cloud-target-option-${option.value}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : (
        <Textarea
          id={controlId}
          aria-labelledby={labelId}
          aria-required
          value={props.answer}
          onChange={(event) => {
            props.onAnswerChange(props.question.questionKey, event.target.value);
          }}
          onBlur={() => {
            if (showAllMode && (props.answer.trim().length > 0)) {
              props.onSaveAndContinue(props.question.questionKey);
            }
          }}
          rows={isPrimary ? 3 : 2}
          disabled={props.busy}
        />
      )}
      <div
        className="flex flex-row flex-wrap items-center gap-2"
        data-testid="socratic-question-actions"
      >
        <Button
          type="button"
          size={actionSize}
          variant="outline"
          disabled={props.busy || props.canSaveAndContinue !== true}
          onClick={() => {
            props.onSaveAndContinue(props.question.questionKey);
          }}
          data-testid="socratic-save-and-continue"
        >
          {saveLabel}
        </Button>
        <Button
          type="button"
          size={actionSize}
          variant="outline"
          disabled={props.busy}
          onClick={() => {
            props.onSkip(props.question.questionKey);
          }}
          data-testid="socratic-skip-clarification"
        >
          Skip this clarification
        </Button>
      </div>
    </fieldset>
  );
}
