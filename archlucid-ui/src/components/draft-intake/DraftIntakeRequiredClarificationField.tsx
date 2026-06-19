"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DraftElicitationQuestion } from "@/types/draft-intake";

export type DraftIntakeRequiredClarificationFieldProps = {
  readonly question: DraftElicitationQuestion;
  readonly answer: string;
  readonly busy: boolean;
  readonly clarificationIndex: number;
  readonly clarificationTotal: number;
  readonly compactActions?: boolean;
  readonly onAnswerChange: (questionKey: string, value: string) => void;
  readonly onSave: (questionKey: string) => void;
  readonly onSkip: (questionKey: string) => void;
};

/** Single required-clarification prompt with save / skip actions. */
export function DraftIntakeRequiredClarificationField(
  props: DraftIntakeRequiredClarificationFieldProps,
) {
  const primarySize = props.compactActions === true ? "sm" : "default";

  return (
    <div
      className="space-y-3 rounded-md border p-3"
      data-testid="socratic-question"
      data-question-key={props.question.questionKey}
    >
      <p
        className="m-0 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
        data-testid="socratic-question-progress"
      >
        Required clarification {props.clarificationIndex} of {props.clarificationTotal}
      </p>
      <p className="m-0 text-sm font-medium">{props.question.prompt}</p>
      <Textarea
        value={props.answer}
        onChange={(event) => {
          props.onAnswerChange(props.question.questionKey, event.target.value);
        }}
        rows={2}
        disabled={props.busy}
        aria-label={props.question.prompt}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size={primarySize}
          disabled={props.busy}
          onClick={() => {
            props.onSave(props.question.questionKey);
          }}
        >
          Save and continue
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
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
