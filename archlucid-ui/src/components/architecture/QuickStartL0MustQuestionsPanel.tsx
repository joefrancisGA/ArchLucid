"use client";

import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  DraftIntakeRequiredClarificationField,
  type ClarificationCardStatus,
} from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import { Button } from "@/components/ui/button";
import { ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS } from "@/lib/architecture/architecture-creation-question-definition";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { guidedIntakeClarificationsAnsweredCounter } from "@/lib/guided-intake-copy";
import {
  UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_UNAVAILABLE_HELPER,
  UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER,
} from "@/lib/universal-intake-answer-inference";
import { UNIVERSAL_INTAKE_MUST_QUESTION_KEYS } from "@/lib/universal-intake-must-completeness";
import type { DraftElicitationQuestion } from "@/types/draft-intake";

export type QuickStartL0MustQuestionsPanelProps = {
  readonly answers: Readonly<Record<string, string>>;
  readonly skippedQuestionKeys: ReadonlySet<string>;
  readonly inferredQuestionKeys?: ReadonlySet<string>;
  readonly clarificationSuggestionsUnavailable?: boolean;
  readonly busy: boolean;
  readonly onAnswersChange: (answers: Readonly<Record<string, string>>) => void;
  readonly onSkippedQuestionKeysChange: (skippedQuestionKeys: ReadonlySet<string>) => void;
  readonly onQuestionEdited?: (questionKey: string) => void;
};

function isQuickStartClarificationHandled(
  questionKey: string,
  answers: Readonly<Record<string, string>>,
  skippedQuestionKeys: ReadonlySet<string>,
  savedLocallyQuestionKeys: ReadonlySet<string>,
): boolean {
  if (skippedQuestionKeys.has(questionKey)) {
    return true;
  }

  if (savedLocallyQuestionKeys.has(questionKey)) {
    return (answers[questionKey]?.trim() ?? "").length > 0;
  }

  return false;
}

/** Quick start L0 MUST interviewer — reuses Guided questions field chrome (TB-2283). */
export function QuickStartL0MustQuestionsPanel(props: QuickStartL0MustQuestionsPanelProps) {
  const total = UNIVERSAL_INTAKE_MUST_QUESTION_KEYS.length;
  const [savedLocallyQuestionKeys, setSavedLocallyQuestionKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [viewAllClarifications, setViewAllClarifications] = useState(false);

  const clarificationOrdinalByKey = useMemo(() => {
    const ordinals = new Map<string, number>();

    UNIVERSAL_INTAKE_MUST_QUESTION_KEYS.forEach((questionKey, index) => {
      ordinals.set(questionKey, index + 1);
    });

    return ordinals;
  }, []);

  const activePendingQuestions = useMemo(
    () =>
      ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS.filter(
        (question) =>
          !isQuickStartClarificationHandled(
            question.questionKey,
            props.answers,
            props.skippedQuestionKeys,
            savedLocallyQuestionKeys,
          ),
      ),
    [props.answers, props.skippedQuestionKeys, savedLocallyQuestionKeys],
  );

  const handledClarificationCount = total - activePendingQuestions.length;

  const getClarificationOrdinal = useCallback(
    (questionKey: string): number => clarificationOrdinalByKey.get(questionKey) ?? 0,
    [clarificationOrdinalByKey],
  );

  const getClarificationStatus = useCallback(
    (questionKey: string): ClarificationCardStatus | undefined => {
      if (props.skippedQuestionKeys.has(questionKey)) {
        return { kind: "draft", label: "Skipped" };
      }

      if (savedLocallyQuestionKeys.has(questionKey)) {
        return { kind: "ready", label: "Answered" };
      }

      return undefined;
    },
    [props.skippedQuestionKeys, savedLocallyQuestionKeys],
  );

  const handleAnswerChange = useCallback(
    (questionKey: string, value: string) => {
      props.onQuestionEdited?.(questionKey);
      props.onAnswersChange({
        ...props.answers,
        [questionKey]: value,
      });

      if (props.skippedQuestionKeys.has(questionKey)) {
        const nextSkipped = new Set(props.skippedQuestionKeys);
        nextSkipped.delete(questionKey);
        props.onSkippedQuestionKeysChange(nextSkipped);
      }

      if (savedLocallyQuestionKeys.has(questionKey)) {
        const nextSaved = new Set(savedLocallyQuestionKeys);
        nextSaved.delete(questionKey);
        setSavedLocallyQuestionKeys(nextSaved);
      }
    },
    [props, savedLocallyQuestionKeys],
  );

  const handleSaveAndContinue = useCallback(
    (questionKey: string) => {
      const answer = props.answers[questionKey]?.trim() ?? "";

      if (answer.length === 0) {
        return;
      }

      setSavedLocallyQuestionKeys((current) => {
        const next = new Set(current);
        next.add(questionKey);

        return next;
      });
    },
    [props.answers],
  );

  const handleSkip = useCallback(
    (questionKey: string) => {
      const nextSkipped = new Set(props.skippedQuestionKeys);
      nextSkipped.add(questionKey);
      props.onSkippedQuestionKeysChange(nextSkipped);
    },
    [props],
  );

  const primaryPendingQuestion = activePendingQuestions[0] ?? null;
  const otherPendingQuestions =
    viewAllClarifications && activePendingQuestions.length > 1 ? activePendingQuestions.slice(1) : [];

  const renderClarificationField = (
    question: DraftElicitationQuestion,
    options: {
      readonly isPrimary: boolean;
      readonly isFocused: boolean;
    },
  ): React.JSX.Element => {
    const questionKey = question.questionKey;

    return (
      <DraftIntakeRequiredClarificationField
        key={questionKey}
        question={question}
        answer={props.answers[questionKey] ?? ""}
        busy={props.busy}
        clarificationIndex={getClarificationOrdinal(questionKey)}
        clarificationTotal={total}
        isPrimary={options.isPrimary}
        isFocused={options.isFocused}
        compactActions={viewAllClarifications}
        showAllMode={viewAllClarifications}
        showBaselineLabel={false}
        showRequirednessSuffix={false}
        isSuggested={props.inferredQuestionKeys?.has(questionKey) === true}
        clarificationStatus={getClarificationStatus(questionKey)}
        canSaveAndContinue={(props.answers[questionKey]?.trim() ?? "").length > 0}
        onAnswerChange={handleAnswerChange}
        onSaveAndContinue={handleSaveAndContinue}
        onSkip={handleSkip}
      />
    );
  };

  return (
    <CollapsibleSection
      title="Required clarifications"
      summaryLine={`${handledClarificationCount} of ${total} answered or marked unknown`}
      defaultOpen
      sectionTestId="first-pilot-l0-must-panel"
    >
      <div className="space-y-4">
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Quick start collects the same baseline facts Guided questions requires before analysis begins.
        </p>

        {(props.inferredQuestionKeys?.size ?? 0) > 0 ? (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="first-pilot-l0-inferred-helper"
          >
            {UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER}
          </p>
        ) : null}

        {props.clarificationSuggestionsUnavailable === true ? (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="first-pilot-l0-inference-unavailable"
          >
            {UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_UNAVAILABLE_HELPER}
          </p>
        ) : null}

        {primaryPendingQuestion !== null
          ? renderClarificationField(primaryPendingQuestion, {
              isPrimary: true,
              isFocused: !viewAllClarifications,
            })
          : (
            <p
              className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="first-pilot-l0-must-complete"
            >
              All required clarifications are answered or marked unknown.
            </p>
          )}

        {total > 1 && activePendingQuestions.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={props.busy}
            data-testid="first-pilot-view-all-clarifications"
            onClick={() => {
              setViewAllClarifications((current) => !current);
            }}
          >
            {viewAllClarifications
              ? "Show one at a time"
              : `Show all ${activePendingQuestions.length} remaining clarifications`}
          </Button>
        ) : null}

        {otherPendingQuestions.length > 0 ? (
          <div className="space-y-3" data-testid="first-pilot-other-clarifications">
            <p
              className={cn(
                "m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
                OPERATOR_TYPOGRAPHY.tab,
              )}
            >
              Other clarifications
            </p>
            {otherPendingQuestions.map((question) =>
              renderClarificationField(question, {
                isPrimary: false,
                isFocused: false,
              }),
            )}
          </div>
        ) : null}

        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="first-pilot-l0-must-progress"
        >
          {guidedIntakeClarificationsAnsweredCounter(handledClarificationCount, total)}
        </p>
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
