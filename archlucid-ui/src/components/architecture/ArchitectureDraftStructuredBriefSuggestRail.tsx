"use client";

import { LongOperationWaitNotice } from "@/components/LongOperationWaitNotice";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { ReviewStartInlineSpinner } from "@/components/review-intake/ReviewStartInlineSpinner";
import { Button } from "@/components/ui/button";
import { ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS } from "@/lib/api/architecture-request-draft-api";
import { OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPTIONAL_FIELDS_NOTE,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SECTION_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EMPTY,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EDITOR_LOCKED_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_IN_PROGRESS_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_VIEW_IN_PROGRESS_BUTTON,
  guidedIntakeStructuredBriefSuggestDisabledHint,
  guidedIntakeStructuredBriefSuggestSuccess,
} from "@/lib/guided-intake-copy";
import { requestOpenShellInFlightOperations } from "@/lib/operations/open-shell-in-flight-event";
import { cn } from "@/lib/utils";

import type { StructuredBriefSuggestionsState } from "@/components/architecture/use-structured-brief-suggestions";

export type ArchitectureDraftStructuredBriefSuggestRailProps = {
  readonly suggestions: StructuredBriefSuggestionsState;
  readonly disabled?: boolean;
  readonly blocksLlmExecution?: boolean;
};

export function ArchitectureDraftStructuredBriefSuggestRail(
  props: ArchitectureDraftStructuredBriefSuggestRailProps,
): React.JSX.Element {
  const { suggestions } = props;

  return (
    <div className="space-y-2">
      <p className={cn("m-0", OPERATOR_FORM_FIELD_LABEL_CLASS)}>
        {GUIDED_INTAKE_STRUCTURED_BRIEF_SECTION_LABEL}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
        Confirm constraints and assumptions so review engines do not invent them from free text alone.
        {" "}
        {GUIDED_INTAKE_STRUCTURED_BRIEF_OPTIONAL_FIELDS_NOTE}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!suggestions.canSuggestFromOverview}
          aria-busy={suggestions.suggestBusy}
          onClick={suggestions.onSuggestFromOverview}
          data-testid="architecture-draft-suggest-structured-brief"
          data-loading={suggestions.suggestBusy ? "true" : "false"}
        >
          {suggestions.suggestBusy ? (
            <>
              <ReviewStartInlineSpinner className="h-3.5 w-3.5" />
              <span>Suggesting…</span>
            </>
          ) : (
            "Suggest from overview"
          )}
        </Button>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
          Suggestions stay unconfirmed until you add or confirm them.
        </p>
      </div>
      <LongOperationWaitNotice
        active={suggestions.suggestBusy}
        operationLabel="Structured brief suggestions"
        stageLabel={suggestions.suggestStageLabel ?? "Structured brief suggestions"}
        testId="architecture-draft-suggest-structured-brief-wait"
        showTimeoutRecovery={false}
      />
      {suggestions.suggestBusy ? (
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="architecture-draft-suggest-structured-brief-in-progress-hint"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
            {GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_IN_PROGRESS_HINT}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              requestOpenShellInFlightOperations();
            }}
            data-testid="architecture-draft-suggest-structured-brief-view-in-progress"
          >
            {GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_VIEW_IN_PROGRESS_BUTTON}
          </Button>
        </div>
      ) : null}
      {!suggestions.canSuggestFromOverview && props.blocksLlmExecution === true ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
          role="status"
          data-testid="architecture-draft-suggest-structured-brief-budget-blocked"
        >
          Monthly AI budget is exhausted — suggestions are paused until the budget resets or your admin raises the limit.
        </p>
      ) : null}
      {!suggestions.canSuggestFromOverview
      && props.blocksLlmExecution !== true
      && suggestions.overviewTrimmedLength < ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-500")}
          role="status"
          data-testid="architecture-draft-suggest-structured-brief-disabled-hint"
        >
          {guidedIntakeStructuredBriefSuggestDisabledHint(suggestions.overviewTrimmedLength)}
        </p>
      ) : null}
      {!suggestions.canSuggestFromOverview && props.disabled === true && props.blocksLlmExecution !== true
      && suggestions.overviewTrimmedLength >= ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS
      && !suggestions.suggestBusy ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
          role="status"
          data-testid="architecture-draft-suggest-structured-brief-editor-locked-hint"
        >
          {GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EDITOR_LOCKED_HINT}
        </p>
      ) : null}
      {suggestions.suggestAddedCount !== null && suggestions.suggestAddedCount > 0 ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-emerald-800 dark:text-emerald-200")}
          role="status"
          data-testid="architecture-draft-suggest-structured-brief-success"
        >
          {guidedIntakeStructuredBriefSuggestSuccess(suggestions.suggestAddedCount)}
        </p>
      ) : null}
      {suggestions.suggestEmpty ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
          role="status"
          data-testid="architecture-draft-suggest-structured-brief-empty"
        >
          {GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EMPTY}
        </p>
      ) : null}
      {suggestions.suggestError !== null ? (
        <OperatorApiProblem
          problem={suggestions.suggestError.problem}
          fallbackMessage={suggestions.suggestError.message}
          correlationId={suggestions.suggestError.correlationId}
        />
      ) : null}
    </div>
  );
}
