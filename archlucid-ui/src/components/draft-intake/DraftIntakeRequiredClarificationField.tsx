"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DraftElicitationQuestion } from "@/types/draft-intake";

export const REQUIRED_CLARIFICATION_BASELINE_LABEL = "Required for baseline review";

export type DraftIntakeRequiredClarificationFieldProps = {
  readonly question: DraftElicitationQuestion;
  readonly answer: string;
  readonly busy: boolean;
  readonly clarificationIndex: number;
  readonly clarificationTotal: number;
  readonly isPrimary?: boolean;
  readonly compactActions?: boolean;
  readonly onAnswerChange: (questionKey: string, value: string) => void;
  readonly onSave: (questionKey: string) => void;
  readonly onSkip: (questionKey: string) => void;
};

/** Single required-clarification prompt with save / skip actions. */
export function DraftIntakeRequiredClarificationField(
  props: DraftIntakeRequiredClarificationFieldProps,
) {
  const actionSize = props.compactActions === true ? "sm" : "default";
  const isPrimary = props.isPrimary !== false;

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
        className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
        data-testid="socratic-question-progress"
      >
        Required clarification {props.clarificationIndex} of {props.clarificationTotal}
      </p>
      <p
        className="m-0 text-xs text-neutral-500 dark:text-neutral-400"
        data-testid="socratic-question-baseline-label"
      >
        {REQUIRED_CLARIFICATION_BASELINE_LABEL}
      </p>
      <p className={cn("m-0 text-sm font-medium", !isPrimary && "text-neutral-700 dark:text-neutral-300")}>
        {props.question.prompt}
      </p>
      <Textarea
        value={props.answer}
        onChange={(event) => {
          props.onAnswerChange(props.question.questionKey, event.target.value);
        }}
        rows={isPrimary ? 3 : 2}
        disabled={props.busy}
        aria-label={props.question.prompt}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size={actionSize}
          disabled={props.busy}
          onClick={() => {
            props.onSave(props.question.questionKey);
          }}
        >
          Save and continue
        </Button>
        <Button
          type="button"
          size={actionSize}
          variant="ghost"
          disabled={props.busy}
          onClick={() => {
            props.onSkip(props.question.questionKey);
          }}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
