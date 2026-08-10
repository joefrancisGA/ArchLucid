"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DraftElicitationQuestion } from "@/types/draft-intake";

export const REQUIRED_CLARIFICATION_BASELINE_LABEL = "Required for baseline review";

/** L0 MUST question key — answers are exact CloudProvider enum names. */
export const CLOUD_TARGET_QUESTION_KEY = "l0.pillar.cloud-target";

const CLOUD_TARGET_OPTIONS = [
  { value: "None", label: "Cloud-neutral (no specific provider)" },
  { value: "Azure", label: "Microsoft Azure" },
  { value: "Aws", label: "Amazon Web Services (AWS)" },
  { value: "Gcp", label: "Google Cloud (GCP)" },
] as const;

export type DraftIntakeRequiredClarificationFieldProps = {
  readonly question: DraftElicitationQuestion;
  readonly answer: string;
  readonly busy: boolean;
  readonly clarificationIndex: number;
  readonly clarificationTotal: number;
  readonly isPrimary?: boolean;
  readonly compactActions?: boolean;
  readonly canSaveAndContinue?: boolean;
  readonly onAnswerChange: (questionKey: string, value: string) => void;
  readonly onSaveAndContinue: (questionKey: string) => void;
  readonly onSkip: (questionKey: string) => void;
};

/** Single required-clarification prompt; answers persist when the operator reviews. */
export function DraftIntakeRequiredClarificationField(
  props: DraftIntakeRequiredClarificationFieldProps,
) {
  const actionSize = props.compactActions === true ? "sm" : "default";
  const isPrimary = props.isPrimary !== false;
  const isCloudTargetQuestion = props.question.questionKey === CLOUD_TARGET_QUESTION_KEY;

  return (
    <div
      className={cn(
        "space-y-3 rounded-md border p-3",
        isPrimary
          ? "border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
          : "border-neutral-200 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/30",
      )}
      data-testid="socratic-question"
      data-question-key={props.question.questionKey}
      data-question-primary={isPrimary ? "true" : "false"}
    >
      <p
        className={cn("m-0 font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="socratic-question-progress"
      >
        Required clarification {props.clarificationIndex} of {props.clarificationTotal}
      </p>
      <p
        className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="socratic-question-baseline-label"
      >
        {REQUIRED_CLARIFICATION_BASELINE_LABEL}
      </p>
      <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body, !isPrimary && "text-neutral-700 dark:text-neutral-300")}>
        {props.question.prompt}
      </p>
      {isCloudTargetQuestion ? (
        <Select
          value={props.answer.length > 0 ? props.answer : undefined}
          onValueChange={(value) => {
            props.onAnswerChange(props.question.questionKey, value);
          }}
          disabled={props.busy}
        >
          <SelectTrigger
            aria-label={props.question.prompt}
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
      ) : (
        <Textarea
          value={props.answer}
          onChange={(event) => {
            props.onAnswerChange(props.question.questionKey, event.target.value);
          }}
          rows={isPrimary ? 3 : 2}
          disabled={props.busy}
          aria-label={props.question.prompt}
        />
      )}
      <div className="flex flex-col items-start gap-2" data-testid="socratic-question-actions">
        <Button
          type="button"
          size={actionSize}
          variant="primary"
          disabled={props.busy || props.canSaveAndContinue !== true}
          onClick={() => {
            props.onSaveAndContinue(props.question.questionKey);
          }}
          data-testid="socratic-save-and-continue"
        >
          Save and continue
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
    </div>
  );
}
