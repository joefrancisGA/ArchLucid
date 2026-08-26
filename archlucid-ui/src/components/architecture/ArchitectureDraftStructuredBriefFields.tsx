"use client";

import type { Dispatch, SetStateAction } from "react";

import { ArchitectureDraftStructuredBriefConfirmableChipList } from "@/components/architecture/ArchitectureDraftStructuredBriefConfirmableChipList";
import {
  addConfirmedListItem,
  confirmSuggestedListItem,
  denySuggestedListItem,
  removeConfirmedListItem,
  type StructuredBriefListFieldKey,
} from "@/components/architecture/structured-brief-list-mutations";
import { useStructuredBriefSuggestions } from "@/components/architecture/use-structured-brief-suggestions";
import { LongOperationWaitNotice } from "@/components/LongOperationWaitNotice";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { StructuredBriefCapabilitiesQualityVocabularyRail } from "@/components/StructuredBriefCapabilitiesQualityVocabularyRail";
import { IntakeTextField } from "@/components/intake/IntakeTextField";
import { Button } from "@/components/ui/button";
import { ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS } from "@/lib/api/architecture-request-draft-api";
import {
  confirmFailureModeSuggestion,
  denyFailureModeSuggestion,
  joinQualityAttributeEntries,
  mergeUniqueStrings,
  parseQualityAttributeEntries,
  type ArchitectureDraftStructuredBriefState,
  type StructuredBriefSuggestedFieldKey,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON,
  GUIDED_INTAKE_DENY_SUGGESTION_BUTTON,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_PLACEHOLDER,
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_PLACEHOLDER,
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_PLACEHOLDER,
  GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SECTION_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EMPTY,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EDITOR_LOCKED_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_IN_PROGRESS_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_HEADING,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_VIEW_IN_PROGRESS_BUTTON,
  guidedIntakeStructuredBriefSuggestDisabledHint,
  guidedIntakeStructuredBriefSuggestSuccess,
} from "@/lib/guided-intake-copy";
import { requestOpenShellInFlightOperations } from "@/lib/operations/open-shell-in-flight-event";
import { cn } from "@/lib/utils";

type ArchitectureDraftStructuredBriefFieldsProps = {
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly freeTextIntent: string;
  readonly systemName?: string;
  readonly businessOutcome?: string;
  readonly disabled?: boolean;
  readonly blocksLlmExecution?: boolean;
  readonly markReviewReadinessInvalid?: boolean;
  readonly onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>;
  readonly onBriefConfirmOrDeny?: () => void;
  readonly architectureId?: string;
  readonly suggestFromOverviewNonce?: number;
};

/** Structured brief lists and quality notes for architecture draft review readiness (TB-2282). */
export function ArchitectureDraftStructuredBriefFields(
  props: ArchitectureDraftStructuredBriefFieldsProps,
): React.JSX.Element {
  const brief = props.structuredBrief;

  const suggestions = useStructuredBriefSuggestions({
    structuredBrief: brief,
    freeTextIntent: props.freeTextIntent,
    systemName: props.systemName,
    businessOutcome: props.businessOutcome,
    disabled: props.disabled,
    blocksLlmExecution: props.blocksLlmExecution,
    architectureId: props.architectureId,
    suggestFromOverviewNonce: props.suggestFromOverviewNonce,
    onStructuredBriefChange: (nextBrief) => {
      props.onStructuredBriefChange(nextBrief);
    },
  });

  const updateBrief = (partial: Partial<ArchitectureDraftStructuredBriefState>) => {
    props.onStructuredBriefChange((current) => ({ ...current, ...partial }));
  };

  const confirmSuggested = (
    confirmedKey: StructuredBriefListFieldKey,
    suggestedKey: StructuredBriefSuggestedFieldKey,
    value: string,
  ) => {
    confirmSuggestedListItem(props.onStructuredBriefChange, confirmedKey, suggestedKey, value);
    props.onBriefConfirmOrDeny?.();
  };

  const denySuggested = (suggestedKey: StructuredBriefSuggestedFieldKey, value: string) => {
    denySuggestedListItem(props.onStructuredBriefChange, suggestedKey, value);
    props.onBriefConfirmOrDeny?.();
  };

  return (
    <div className="space-y-6" data-testid="architecture-draft-structured-brief-fields">
      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_FORM_FIELD_LABEL_CLASS)}>
          {GUIDED_INTAKE_STRUCTURED_BRIEF_SECTION_LABEL}
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
          Confirm constraints and assumptions so review engines do not invent them from free text alone.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!suggestions.canSuggestFromOverview}
            onClick={suggestions.onSuggestFromOverview}
            data-testid="architecture-draft-suggest-structured-brief"
          >
            {suggestions.suggestBusy ? "Suggesting…" : "Suggest from overview"}
          </Button>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
            Suggestions stay unconfirmed until you add or confirm them.
          </p>
        </div>
        {suggestions.canSuggestFromOverview && !suggestions.suggestBusy ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
            role="status"
            data-testid="architecture-draft-suggest-structured-brief-duration-hint"
          >
            {suggestions.suggestDurationHint}
          </p>
        ) : null}
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

      <StructuredBriefCapabilitiesQualityVocabularyRail currentSurfaceId="architecture-draft-structured-brief" />

      <ArchitectureDraftStructuredBriefConfirmableChipList
        label="Constraints"
        hint="Hard limits the architecture must not violate — budget, regions, compliance. Leave empty if none are stated."
        inputId="architecture-draft-constraints"
        items={brief.confirmedConstraints}
        suggestedItems={brief.suggestedConstraints}
        suggestionKind="Constraint"
        suggestionSourceText={suggestions.failureModeSourceText}
        invalid={false}
        required={false}
        disabled={props.disabled === true}
        onAdd={(value) => {
          addConfirmedListItem(
            props.onStructuredBriefChange,
            "confirmedConstraints",
            "suggestedConstraints",
            value,
          );
          props.onBriefConfirmOrDeny?.();
        }}
        onRemove={(index) => {
          removeConfirmedListItem(props.onStructuredBriefChange, "confirmedConstraints", index);
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedConstraints", "suggestedConstraints", value);
        }}
        onDenySuggested={(value) => {
          denySuggested("suggestedConstraints", value);
        }}
      />

      <ArchitectureDraftStructuredBriefConfirmableChipList
        label="Assumptions"
        hint="Facts agents may rely on unless evidence contradicts them. Leave empty if none are stated."
        inputId="architecture-draft-assumptions"
        items={brief.confirmedAssumptions}
        suggestedItems={brief.suggestedAssumptions}
        suggestionKind="Assumption"
        suggestionSourceText={suggestions.failureModeSourceText}
        invalid={false}
        required={false}
        disabled={props.disabled === true}
        onAdd={(value) => {
          addConfirmedListItem(
            props.onStructuredBriefChange,
            "confirmedAssumptions",
            "suggestedAssumptions",
            value,
          );
          props.onBriefConfirmOrDeny?.();
        }}
        onRemove={(index) => {
          removeConfirmedListItem(props.onStructuredBriefChange, "confirmedAssumptions", index);
          suggestions.setEvidenceContradictedAssumptions({});
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedAssumptions", "suggestedAssumptions", value);
        }}
        onDenySuggested={(value) => {
          denySuggested("suggestedAssumptions", value);
        }}
        evidenceContradictionNotes={suggestions.evidenceContradictedAssumptions}
      />

      <ArchitectureDraftStructuredBriefConfirmableChipList
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_HINT}
        inputId="architecture-draft-capabilities"
        items={brief.confirmedRequiredCapabilities}
        suggestedItems={brief.suggestedRequiredCapabilities}
        suggestionKind="RequiredCapability"
        suggestionSourceText={suggestions.failureModeSourceText}
        invalid={false}
        required={false}
        disabled={props.disabled === true}
        onAdd={(value) => {
          addConfirmedListItem(
            props.onStructuredBriefChange,
            "confirmedRequiredCapabilities",
            "suggestedRequiredCapabilities",
            value,
          );
          props.onBriefConfirmOrDeny?.();
        }}
        onRemove={(index) => {
          removeConfirmedListItem(props.onStructuredBriefChange, "confirmedRequiredCapabilities", index);
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedRequiredCapabilities", "suggestedRequiredCapabilities", value);
        }}
        onDenySuggested={(value) => {
          denySuggested("suggestedRequiredCapabilities", value);
        }}
      />

      <ArchitectureDraftStructuredBriefConfirmableChipList
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_HINT}
        inputId="architecture-draft-quality-attributes"
        inputPlaceholder={GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_PLACEHOLDER}
        items={parseQualityAttributeEntries(brief.qualityAttribute)}
        suggestedItems={[]}
        invalid={false}
        required={false}
        emptyMessage="No quality attributes yet."
        disabled={props.disabled === true}
        helpSlug="structured-brief"
        helpHashFragment="field-concepts"
        helpLabel="Read quality attributes help"
        onAdd={(value) => {
          props.onStructuredBriefChange((current) => ({
            ...current,
            qualityAttribute: joinQualityAttributeEntries(
              mergeUniqueStrings(parseQualityAttributeEntries(current.qualityAttribute), [value]),
            ),
          }));
        }}
        onRemove={(index) => {
          props.onStructuredBriefChange((current) => ({
            ...current,
            qualityAttribute: joinQualityAttributeEntries(
              parseQualityAttributeEntries(current.qualityAttribute).filter(
                (_, itemIndex) => itemIndex !== index,
              ),
            ),
          }));
        }}
        onConfirmSuggested={() => undefined}
        onDenySuggested={() => undefined}
      />

      <div className="space-y-2" data-testid="architecture-draft-failure-mode">
        <IntakeTextField
          id="architecture-draft-failure-mode"
          label={GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_LABEL}
          hint={GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_HINT}
          required={false}
          value={brief.failureModeNote}
          placeholder={GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_PLACEHOLDER}
          disabled={props.disabled === true}
          testId="architecture-draft-failure-mode-input"
          onChange={(value) => {
            updateBrief({
              failureModeNote: value,
              suggestedFailureModeNote:
                value.trim().length > 0 ? "" : brief.suggestedFailureModeNote,
            });
          }}
        />
        {brief.suggestedFailureModeNote.trim().length > 0 ? (
          <div className="space-y-2">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
              {GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_HEADING}
            </p>
            <div
              className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
              data-testid="architecture-draft-failure-mode-suggestion"
            >
              <p className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                {brief.suggestedFailureModeNote}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={props.disabled === true}
                  onClick={() => {
                    props.onStructuredBriefChange((current) => denyFailureModeSuggestion(current));
                    props.onBriefConfirmOrDeny?.();
                  }}
                >
                  {GUIDED_INTAKE_DENY_SUGGESTION_BUTTON}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={props.disabled === true}
                  onClick={() => {
                    props.onStructuredBriefChange((current) => confirmFailureModeSuggestion(current));
                    props.onBriefConfirmOrDeny?.();
                  }}
                >
                  {GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <IntakeTextField
        id="architecture-draft-operational-owner"
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_HINT}
        required={false}
        value={brief.operationalOwner}
        placeholder={GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_PLACEHOLDER}
        disabled={props.disabled === true}
        testId="architecture-draft-operational-owner"
        onChange={(value) => {
          updateBrief({ operationalOwner: value });
        }}
      />
    </div>
  );
}
