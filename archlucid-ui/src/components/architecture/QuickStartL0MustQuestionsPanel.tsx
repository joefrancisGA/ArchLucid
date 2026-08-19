"use client";

import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DraftIntakeRequiredClarificationField } from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import { ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS } from "@/lib/architecture/architecture-creation-question-definition";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  isUniversalIntakeMustQuestionSatisfied,
  UNIVERSAL_INTAKE_MUST_QUESTION_KEYS,
} from "@/lib/universal-intake-must-completeness";

export type QuickStartL0MustQuestionsPanelProps = {
  readonly answers: Readonly<Record<string, string>>;
  readonly skippedQuestionKeys: ReadonlySet<string>;
  readonly busy: boolean;
  readonly onAnswersChange: (answers: Readonly<Record<string, string>>) => void;
  readonly onSkippedQuestionKeysChange: (skippedQuestionKeys: ReadonlySet<string>) => void;
};

/** Quick start L0 MUST interviewer — reuses Guided questions field chrome (TB-2283). */
export function QuickStartL0MustQuestionsPanel(props: QuickStartL0MustQuestionsPanelProps) {
  const total = UNIVERSAL_INTAKE_MUST_QUESTION_KEYS.length;
  const answeredCount = useMemo(
    () =>
      UNIVERSAL_INTAKE_MUST_QUESTION_KEYS.filter((questionKey) =>
        isUniversalIntakeMustQuestionSatisfied(questionKey, props.answers, props.skippedQuestionKeys),
      ).length,
    [props.answers, props.skippedQuestionKeys],
  );

  const handleAnswerChange = useCallback(
    (questionKey: string, value: string) => {
      props.onAnswersChange({
        ...props.answers,
        [questionKey]: value,
      });

      if (props.skippedQuestionKeys.has(questionKey)) {
        const nextSkipped = new Set(props.skippedQuestionKeys);
        nextSkipped.delete(questionKey);
        props.onSkippedQuestionKeysChange(nextSkipped);
      }
    },
    [props],
  );

  const handleSaveAndContinue = useCallback(
    (_questionKey: string) => {
      // Quick start tracks answers inline; save-and-continue only dismisses the row affordance.
    },
    [],
  );

  const handleSkip = useCallback(
    (questionKey: string) => {
      const nextSkipped = new Set(props.skippedQuestionKeys);
      nextSkipped.add(questionKey);
      props.onSkippedQuestionKeysChange(nextSkipped);
    },
    [props],
  );

  return (
    <CollapsibleSection
      title="Required clarifications"
      summaryLine={`${answeredCount} of ${total} answered or marked unknown`}
      defaultOpen
      sectionTestId="first-pilot-l0-must-panel"
    >
      <div className="space-y-4">
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Quick start collects the same baseline facts Guided questions requires before analysis begins.
        </p>
        {ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS.map((question, index) => (
          <DraftIntakeRequiredClarificationField
            key={question.questionKey}
            question={question}
            answer={props.answers[question.questionKey] ?? ""}
            busy={props.busy}
            clarificationIndex={index + 1}
            clarificationTotal={total}
            isPrimary={index === 0}
            compactActions
            canSaveAndContinue={(props.answers[question.questionKey]?.trim() ?? "").length > 0}
            onAnswerChange={handleAnswerChange}
            onSaveAndContinue={handleSaveAndContinue}
            onSkip={handleSkip}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}

export function useQuickStartL0MustQuestionState(): {
  readonly answers: Readonly<Record<string, string>>;
  readonly skippedQuestionKeys: ReadonlySet<string>;
  readonly setAnswers: (answers: Readonly<Record<string, string>>) => void;
  readonly setSkippedQuestionKeys: (skippedQuestionKeys: ReadonlySet<string>) => void;
} {
  const [answers, setAnswers] = useState<Readonly<Record<string, string>>>({});
  const [skippedQuestionKeys, setSkippedQuestionKeys] = useState<ReadonlySet<string>>(() => new Set());

  return {
    answers,
    skippedQuestionKeys,
    setAnswers,
    setSkippedQuestionKeys,
  };
}
