"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ArchitectureIntelligenceFramingQuestion } from "@/lib/architecture/architecture-intelligence-framing-interview";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureIntelligenceFramingInterviewPanelProps = {
  readonly questions: readonly ArchitectureIntelligenceFramingQuestion[];
  readonly answers: Readonly<Record<string, string>>;
  readonly busy: boolean;
  readonly canResubmit: boolean;
  readonly testIdPrefix?: string;
  readonly onAnswerChange: (questionId: string, value: string) => void;
  readonly onResubmit: () => void;
};

/** Inline framing interview for draft refine and other compact closed-loop surfaces. */
export function ArchitectureIntelligenceFramingInterviewPanel(
  props: ArchitectureIntelligenceFramingInterviewPanelProps,
) {
  const prefix = props.testIdPrefix ?? "architecture-intelligence-framing";

  if (props.questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid={`${prefix}-panel`}>
      <div className="space-y-1">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Framing questions
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Answer the open framing questions below, then re-run refine to unblock publish.
        </p>
      </div>

      <div className="space-y-3">
        {props.questions.map((question) => (
          <div key={question.questionId} className="space-y-1">
            <Label htmlFor={`${prefix}-${question.questionId}`}>{question.prompt}</Label>
            <Textarea
              id={`${prefix}-${question.questionId}`}
              data-testid={`${prefix}-${question.questionId}`}
              value={props.answers[question.questionId] ?? question.confirmedAnswer ?? ""}
              onChange={(event) => {
                props.onAnswerChange(question.questionId, event.target.value);
              }}
              rows={2}
              disabled={props.busy}
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        size="sm"
        disabled={props.busy || !props.canResubmit}
        data-testid={`${prefix}-resubmit`}
        onClick={props.onResubmit}
      >
        {props.busy ? "Re-running refine…" : "Re-run refine with answers"}
      </Button>
    </div>
  );
}
