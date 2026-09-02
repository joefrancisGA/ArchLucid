"use client";

import type { Dispatch, SetStateAction } from "react";

import { cn } from "@/lib/utils";

import { DraftIntakeRequiredClarificationField } from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import { EvidenceExtractionAwaitingSkeleton } from "@/components/evidence/EvidenceExtractionAwaitingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_CREATION_STEP1_CARD_DESCRIPTION,
  GUIDED_INTAKE_CLARIFICATION_SUGGEST_FROM_BRIEF_HELPER,
  GUIDED_INTAKE_CLARIFICATION_SUGGEST_FROM_BRIEF_LABEL,
} from "@/lib/guided-intake-copy";
import {
  UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_REQUIRE_REAL_LLM_HELPER,
  UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_UNAVAILABLE_HELPER,
  UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER,
  UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_SYNTHESIS_HELPER,
} from "@/lib/universal-intake-answer-inference";
import { WIZARD_STICKY_FOOTER_SCROLL_CLEARANCE_CLASS } from "@/lib/wizard-sticky-progress";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { DraftElicitationQuestion } from "@/types/draft-intake";

import { GuidedIntakeRequestError } from "./GuidedIntakeRequestError";
import { SocraticIntakeWizardFooterActions } from "./SocraticIntakeWizardFooterActions";
import { INTAKE_STEPS } from "./guided-intake-steps";

export type SocraticIntakeWizardStepClarificationsProps = {
  readonly isCreateArchitectureFlow: boolean;
  readonly activePendingQuestions: readonly DraftElicitationQuestion[];
  readonly primaryPendingQuestion: DraftElicitationQuestion | null;
  readonly otherPendingQuestions: readonly DraftElicitationQuestion[];
  readonly pendingQuestions: readonly DraftElicitationQuestion[];
  readonly answers: Record<string, string>;
  readonly setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
  readonly viewAllClarifications: boolean;
  readonly setViewAllClarifications: Dispatch<SetStateAction<boolean>>;
  readonly totalRequiredClarifications: number;
  readonly handledClarificationCount: number;
  readonly allClarificationsHandled: boolean;
  readonly getClarificationOrdinal: (questionKey: string) => number;
  readonly getClarificationStatus: (
    questionKey: string,
  ) => { kind: EnterpriseStatusKind; label: string } | undefined;
  readonly inferredQuestionKeys: ReadonlySet<string>;
  readonly rephrasedQuestionKeys: ReadonlySet<string>;
  readonly isExtractingEvidenceText: boolean;
  readonly canSuggestFromEvidence: boolean;
  readonly isSimulator: boolean;
  readonly clarificationSuggestionsUnavailable: boolean;
  readonly busy: boolean;
  readonly submitError: unknown;
  readonly canReviewAnswers: boolean;
  readonly isSubmitBlocked: boolean;
  readonly suggestAnswersFromEvidence: () => void;
  readonly markQuestionEdited: (questionKey: string) => void;
  readonly saveAndContinue: (questionKey: string) => void;
  readonly skipQuestion: (questionKey: string) => Promise<void>;
  readonly reviewAnswers: () => Promise<void>;
  readonly onAdvanceToConfirm: () => void;
};

/** Guided-intake step 1: required clarifications card, inference helpers, and sticky footer. */
export function SocraticIntakeWizardStepClarifications(
  props: SocraticIntakeWizardStepClarificationsProps,
): React.JSX.Element {
  const suggestedDraftCount = props.inferredQuestionKeys.size;
  const hasRephrasedSuggestions = props.rephrasedQuestionKeys.size > 0;

  function renderClarificationField(
    question: DraftElicitationQuestion,
    options: {
      readonly isPrimary: boolean;
      readonly isFocused: boolean;
    },
  ): React.JSX.Element {
    const questionKey = question.questionKey;

    return (
      <DraftIntakeRequiredClarificationField
        key={questionKey}
        question={question}
        answer={props.answers[questionKey] ?? ""}
        busy={props.busy}
        clarificationIndex={props.getClarificationOrdinal(questionKey)}
        clarificationTotal={props.totalRequiredClarifications}
        isPrimary={options.isPrimary}
        isFocused={options.isFocused}
        compactActions={props.viewAllClarifications}
        showAllMode={props.viewAllClarifications}
        showRequirednessSuffix={false}
        clarificationStatus={props.getClarificationStatus(questionKey)}
        isSuggested={props.inferredQuestionKeys.has(questionKey)}
        suggestionWasRephrased={props.rephrasedQuestionKeys.has(questionKey)}
        canSaveAndContinue={(props.answers[questionKey]?.trim() ?? "").length > 0}
        onAnswerChange={(nextQuestionKey, value) => {
          props.markQuestionEdited(nextQuestionKey);
          props.setAnswers((current) => ({
            ...current,
            [nextQuestionKey]: value,
          }));
        }}
        onSaveAndContinue={(nextQuestionKey) => {
          props.saveAndContinue(nextQuestionKey);
        }}
        onSkip={(nextQuestionKey) => {
          void props.skipQuestion(nextQuestionKey);
        }}
      />
    );
  }

  return (
    <div data-testid="socratic-clarifications-step">
      <Card data-testid="guided-intake-primary-panel">
        <CardHeader className="pb-2">
          <CardTitle as="h2" className="sr-only">
            {INTAKE_STEPS[1].cardTitle}
          </CardTitle>
          <CardDescription>
            {props.isCreateArchitectureFlow ? (
              <>
                {GUIDED_INTAKE_CREATION_STEP1_CARD_DESCRIPTION}{" "}
                Your answers stay with the architecture draft until you choose to start a review.
              </>
            ) : props.activePendingQuestions.length === 0 ? (
              "All required clarifications are answered or skipped. You can continue."
            ) : (
              `${props.activePendingQuestions.length} required clarification${props.activePendingQuestions.length === 1 ? "" : "s"} remaining before review.`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent
          className={cn(
            OPERATOR_LAYOUT.sectionStack,
            props.viewAllClarifications && props.activePendingQuestions.length > 1
              ? WIZARD_STICKY_FOOTER_SCROLL_CLEARANCE_CLASS
              : undefined,
          )}
        >
          {props.primaryPendingQuestion !== null
            ? renderClarificationField(props.primaryPendingQuestion, {
                isPrimary: true,
                isFocused: !props.viewAllClarifications,
              })
            : null}

          {props.isExtractingEvidenceText ? <EvidenceExtractionAwaitingSkeleton /> : null}

          {props.canSuggestFromEvidence ? (
            <div
              className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
              data-testid="guided-intake-clarification-suggest-from-brief"
            >
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                {GUIDED_INTAKE_CLARIFICATION_SUGGEST_FROM_BRIEF_HELPER}
              </p>
              {props.isSimulator ? (
                <p
                  className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="guided-intake-clarification-simulator-suggest-helper"
                >
                  {UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_REQUIRE_REAL_LLM_HELPER}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={props.busy || props.isExtractingEvidenceText}
                data-testid="guided-intake-suggest-from-brief"
                onClick={() => {
                  props.suggestAnswersFromEvidence();
                }}
              >
                {props.isExtractingEvidenceText
                  ? "Suggesting answers…"
                  : GUIDED_INTAKE_CLARIFICATION_SUGGEST_FROM_BRIEF_LABEL}
              </Button>
            </div>
          ) : null}

          {suggestedDraftCount > 0 && !props.viewAllClarifications ? (
            <p
              className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="guided-intake-clarification-inferred-helper"
            >
              {hasRephrasedSuggestions
                ? UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_HELPER
                : UNIVERSAL_INTAKE_INFERRED_CLARIFICATION_SYNTHESIS_HELPER}
            </p>
          ) : null}

          {suggestedDraftCount > 0 && !props.viewAllClarifications ? (
            <p
              className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="guided-intake-clarification-suggested-draft-count"
            >
              {suggestedDraftCount} suggested from your architecture brief — review and save each.
            </p>
          ) : null}

          {props.clarificationSuggestionsUnavailable ? (
            <p
              className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="guided-intake-clarification-inference-unavailable"
            >
              {UNIVERSAL_INTAKE_CLARIFICATION_SUGGESTIONS_UNAVAILABLE_HELPER}
            </p>
          ) : null}

          {props.activePendingQuestions.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={props.busy}
              data-testid="socratic-view-all-clarifications"
              onClick={() => {
                props.setViewAllClarifications((current) => !current);
              }}
            >
              {props.viewAllClarifications
                ? "Show one at a time"
                : `Show all ${props.totalRequiredClarifications} clarifications`}
            </Button>
          ) : null}

          {props.otherPendingQuestions.length > 0 ? (
            <div className="space-y-4" data-testid="socratic-other-clarifications">
              <p
                className={cn(
                  "m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400",
                  OPERATOR_TYPOGRAPHY.tab,
                )}
              >
                Other required clarifications
              </p>
              {props.otherPendingQuestions.map((question) =>
                renderClarificationField(question, {
                  isPrimary: false,
                  isFocused: false,
                }),
              )}
            </div>
          ) : null}

          {!props.viewAllClarifications ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="socratic-clarification-helper">
              Answer or skip each clarification. You can review everything before starting the architecture review.
            </p>
          ) : null}

          {props.submitError !== null ? <GuidedIntakeRequestError error={props.submitError} /> : null}
        </CardContent>
        <SocraticIntakeWizardFooterActions
          handledClarificationCount={props.handledClarificationCount}
          totalRequiredClarifications={props.totalRequiredClarifications}
          allClarificationsHandled={props.allClarificationsHandled}
          canReviewAnswers={props.canReviewAnswers}
          busy={props.busy}
          isSubmitBlocked={props.isSubmitBlocked}
          pendingQuestionCount={props.pendingQuestions.length}
          onReviewAnswers={() => {
            void props.reviewAnswers();
          }}
          onAdvanceToConfirm={props.onAdvanceToConfirm}
        />
      </Card>
    </div>
  );
}
