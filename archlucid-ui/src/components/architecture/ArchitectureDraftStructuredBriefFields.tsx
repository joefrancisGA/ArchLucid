"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

import { StructuredBriefSuggestionExplainPanel } from "@/components/architecture/StructuredBriefSuggestionExplainPanel";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { StructuredBriefCapabilitiesQualityVocabularyRail } from "@/components/StructuredBriefCapabilitiesQualityVocabularyRail";
import { IntakeFieldLabel } from "@/components/intake/IntakeFieldLabel";
import { IntakeTextField } from "@/components/intake/IntakeTextField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StructuredBriefSuggestionKind } from "@/lib/api/structured-brief-suggestion-explain-api";
import { draftArchitectureRequest, ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS } from "@/lib/api/architecture-request-draft-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  countStructuredBriefSuggestionApplyDelta,
  denyStructuredBriefSuggestion,
  joinQualityAttributeEntries,
  mergeExclusiveConfirmedItem,
  mergeUniqueStrings,
  parseQualityAttributeEntries,
  qualityAttributeMeetsMinimum,
  type ArchitectureDraftStructuredBriefState,
  type StructuredBriefSuggestedFieldKey,
} from "@/lib/architecture/architecture-draft-structured-brief";
import {
  applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse,
  applyFailureModeSuggestionIfEmpty,
  buildArchitectureDraftSuggestionSourceText,
  hasArchitectureContextForFailureModeSuggestion,
  resolveFailureModeSuggestion,
} from "@/lib/architecture/architecture-draft-structured-brief-suggestions";
import { OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_PLACEHOLDER,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_SUGGEST_BUTTON,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_SUGGEST_EMPTY,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_SUGGEST_SUCCESS,
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPERATIONAL_OWNER_PLACEHOLDER,
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_PLACEHOLDER,
  GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL,
  GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON,
  GUIDED_INTAKE_DENY_SUGGESTION_BUTTON,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SECTION_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EMPTY,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EDITOR_LOCKED_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_HEADING,
  guidedIntakeStructuredBriefSuggestDisabledHint,
  guidedIntakeStructuredBriefSuggestSuccess,
} from "@/lib/guided-intake-copy";
import { cn } from "@/lib/utils";

type ListFieldKey =
  | "confirmedConstraints"
  | "confirmedAssumptions"
  | "confirmedRequiredCapabilities";

type SuggestedFieldKey = StructuredBriefSuggestedFieldKey;

function addConfirmedListItem(
  onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>,
  confirmedKey: ListFieldKey,
  suggestedKey: SuggestedFieldKey,
  value: string,
): void {
  onStructuredBriefChange((current) => ({
    ...current,
    [confirmedKey]: mergeExclusiveConfirmedItem(current[confirmedKey], value),
    [suggestedKey]: current[suggestedKey].filter((item) => item !== value),
  }));
}

function removeConfirmedListItem(
  onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>,
  confirmedKey: ListFieldKey,
  index: number,
): void {
  onStructuredBriefChange((current) => ({
    ...current,
    [confirmedKey]: current[confirmedKey].filter((_, itemIndex) => itemIndex !== index),
  }));
}

function confirmSuggestedListItem(
  onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>,
  confirmedKey: ListFieldKey,
  suggestedKey: SuggestedFieldKey,
  value: string,
): void {
  onStructuredBriefChange((current) => ({
    ...current,
    [confirmedKey]: mergeExclusiveConfirmedItem(current[confirmedKey], value),
    [suggestedKey]: current[suggestedKey].filter((item) => item !== value),
  }));
}

function denySuggestedListItem(
  onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>,
  suggestedKey: SuggestedFieldKey,
  value: string,
): void {
  onStructuredBriefChange((current) => denyStructuredBriefSuggestion(current, suggestedKey, value));
}

type StructuredBriefSuggestionContextInput = Pick<
  ArchitectureDraftStructuredBriefState,
  | "confirmedConstraints"
  | "confirmedAssumptions"
  | "confirmedRequiredCapabilities"
  | "qualityAttribute"
>;

function buildStructuredBriefSuggestionContext(
  brief: ArchitectureDraftStructuredBriefState,
): StructuredBriefSuggestionContextInput {
  return {
    confirmedConstraints: brief.confirmedConstraints,
    confirmedAssumptions: brief.confirmedAssumptions,
    confirmedRequiredCapabilities: brief.confirmedRequiredCapabilities,
    qualityAttribute: brief.qualityAttribute,
  };
}

function buildSuggestionSourceText(
  props: ArchitectureDraftStructuredBriefFieldsProps,
  brief: ArchitectureDraftStructuredBriefState,
  includeStructuredBrief: boolean,
): string {
  return buildArchitectureDraftSuggestionSourceText({
    architectureOverview: props.freeTextIntent,
    systemName: props.systemName,
    businessOutcome: props.businessOutcome,
    structuredBrief: includeStructuredBrief ? buildStructuredBriefSuggestionContext(brief) : undefined,
  }).trim();
}

function suggestionSourceMeetsMinimum(sourceText: string): boolean {
  return sourceText.trim().length >= ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS;
}

function StructuredBriefListRow(props: {
  readonly item: string;
  readonly testId?: string;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <li
      className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
      data-testid={props.testId}
    >
      <p className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {props.item}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {props.children}
      </div>
    </li>
  );
}

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
  readonly suggestFromOverviewNonce?: number;
};

function ConfirmableChipList(props: {
  readonly label: string;
  readonly hint: string;
  readonly inputId: string;
  readonly items: readonly string[];
  readonly suggestedItems: readonly string[];
  readonly suggestionKind?: StructuredBriefSuggestionKind;
  readonly suggestionSourceText?: string;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly required?: boolean;
  readonly inputPlaceholder?: string;
  readonly emptyMessage?: string;
  readonly helpSlug?: string;
  readonly helpHashFragment?: string;
  readonly helpLabel?: string;
  readonly onAdd: (value: string) => void;
  readonly onRemove: (index: number) => void;
  readonly onConfirmSuggested: (value: string) => void;
  readonly onDenySuggested: (value: string) => void;
}): React.JSX.Element {
  const [draft, setDraft] = useState("");
  const isRequired = props.required !== false;
  const inputPlaceholder = props.inputPlaceholder ?? "Type and Add";
  const emptyMessage = props.emptyMessage ?? "No confirmed items yet.";

  const addDraft = () => {
    const trimmed = draft.trim();

    if (trimmed.length === 0) {
      return;
    }

    props.onAdd(trimmed);
    setDraft("");
  };

  return (
    <div className="space-y-2" data-testid={props.inputId}>
      <IntakeFieldLabel
        htmlFor={`${props.inputId}-input`}
        label={props.label}
        required={isRequired}
      />
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>{props.hint}</p>
      {props.helpSlug !== undefined && props.helpLabel !== undefined ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
          <InAppHelpLink
            helpSlug={props.helpSlug}
            hashFragment={props.helpHashFragment}
            label={props.helpLabel}
            variant="text"
          />
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={`${props.inputId}-input`}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addDraft();
            }
          }}
          disabled={props.disabled}
          className="max-w-md min-w-[12rem] flex-1"
          placeholder={inputPlaceholder}
          aria-invalid={props.invalid}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={props.disabled}
          data-testid={`${props.inputId}-add`}
          onClick={addDraft}
        >
          Add
        </Button>
      </div>
      {props.suggestedItems.length > 0 ? (
        <div className="space-y-2">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
            {GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_HEADING}
          </p>
          <ul className="m-0 list-none space-y-2 p-0">
            {props.suggestedItems.map((item) => (
              <StructuredBriefListRow
                key={`suggested-${props.inputId}-${item}`}
                item={item}
                testId={`${props.inputId}-suggestion`}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={props.disabled}
                  onClick={() => {
                    props.onDenySuggested(item);
                  }}
                >
                  {GUIDED_INTAKE_DENY_SUGGESTION_BUTTON}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={props.disabled}
                  onClick={() => {
                    props.onConfirmSuggested(item);
                  }}
                >
                  {GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON}
                </Button>
                {props.suggestionKind !== undefined
                && props.suggestionSourceText !== undefined
                && props.suggestionSourceText.trim().length >= ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS ? (
                  <StructuredBriefSuggestionExplainPanel
                    suggestionKind={props.suggestionKind}
                    suggestionText={item}
                    sourceText={props.suggestionSourceText}
                    disabled={props.disabled}
                    testId={`${props.inputId}-explain`}
                  />
                ) : null}
              </StructuredBriefListRow>
            ))}
          </ul>
        </div>
      ) : null}
      {props.items.length > 0 ? (
        <ul className="m-0 list-none space-y-2 p-0">
          {props.items.map((item, index) => (
            <StructuredBriefListRow
              key={`${props.inputId}-${index}-${item.slice(0, 12)}`}
              item={item}
              testId={`${props.inputId}-confirmed`}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={props.disabled}
                onClick={() => {
                  props.onRemove(index);
                }}
                aria-label={`Remove ${item}`}
              >
                Remove
              </Button>
            </StructuredBriefListRow>
          ))}
        </ul>
      ) : (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-500")}>{emptyMessage}</p>
      )}
    </div>
  );
}

/** Structured brief lists and quality notes for architecture draft review readiness (TB-2282). */
export function ArchitectureDraftStructuredBriefFields(
  props: ArchitectureDraftStructuredBriefFieldsProps,
): React.JSX.Element {
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestEmpty, setSuggestEmpty] = useState(false);
  const [suggestAddedCount, setSuggestAddedCount] = useState<number | null>(null);
  const [suggestError, setSuggestError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const [failureModeSuggestBusy, setFailureModeSuggestBusy] = useState(false);
  const [failureModeSuggestEmpty, setFailureModeSuggestEmpty] = useState(false);
  const [failureModeSuggestApplied, setFailureModeSuggestApplied] = useState(false);
  const [failureModeSuggestError, setFailureModeSuggestError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const markInvalid = props.markReviewReadinessInvalid === true;
  const brief = props.structuredBrief;
  const overviewTrimmedLength = props.freeTextIntent.trim().length;
  const structuredBriefContext = buildStructuredBriefSuggestionContext(brief);
  const failureModeSourceText = buildSuggestionSourceText(props, brief, true);
  const hasFailureModeContext = hasArchitectureContextForFailureModeSuggestion({
    architectureOverview: props.freeTextIntent,
    structuredBrief: structuredBriefContext,
  });
  const canSuggestFailureMode =
    hasFailureModeContext
    && suggestionSourceMeetsMinimum(failureModeSourceText)
    && props.disabled !== true
    && props.blocksLlmExecution !== true
    && !failureModeSuggestBusy
    && !suggestBusy;

  const canSuggestFromOverview =
    overviewTrimmedLength >= ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS
    && props.disabled !== true
    && props.blocksLlmExecution !== true
    && !suggestBusy
    && !failureModeSuggestBusy;

  const updateBrief = (partial: Partial<ArchitectureDraftStructuredBriefState>) => {
    props.onStructuredBriefChange((current) => ({ ...current, ...partial }));
  };

  const confirmSuggested = (
    confirmedKey: ListFieldKey,
    suggestedKey: SuggestedFieldKey,
    value: string,
  ) => {
    confirmSuggestedListItem(props.onStructuredBriefChange, confirmedKey, suggestedKey, value);
    props.onBriefConfirmOrDeny?.();
  };

  const denySuggested = (suggestedKey: SuggestedFieldKey, value: string) => {
    denySuggestedListItem(props.onStructuredBriefChange, suggestedKey, value);
    props.onBriefConfirmOrDeny?.();
  };


  async function onSuggestFromOverview(): Promise<void> {
    const freeTextDescription = buildSuggestionSourceText(props, brief, true);

    if (
      freeTextDescription.length < ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS
      || !canSuggestFromOverview
    ) {
      return;
    }

    setSuggestBusy(true);
    setSuggestError(null);
    setSuggestEmpty(false);
    setSuggestAddedCount(null);
    setFailureModeSuggestApplied(false);
    setFailureModeSuggestEmpty(false);

    try {
      const response = await draftArchitectureRequest({
        freeTextDescription,
        currentConstraints: [...brief.confirmedConstraints, ...brief.suggestedConstraints],
        currentAssumptions: [...brief.confirmedAssumptions, ...brief.suggestedAssumptions],
      });
      const applied = applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse({
        brief,
        sourceText: freeTextDescription,
        suggestedConstraints: response.suggestedConstraints ?? [],
        suggestedAssumptions: response.suggestedAssumptions ?? [],
        suggestedCapabilities: response.suggestedCapabilities ?? [],
        suggestedFailureModeNote: response.suggestedFailureModeNote,
      });
      const addedSuggestionCount = countStructuredBriefSuggestionApplyDelta(brief, applied.brief);

      props.onStructuredBriefChange(applied.brief);
      setSuggestEmpty(addedSuggestionCount === 0);
      setSuggestAddedCount(addedSuggestionCount > 0 ? addedSuggestionCount : null);

      if (addedSuggestionCount > 0) {
        window.requestAnimationFrame(() => {
          document.getElementById("architecture-draft-constraints")?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
      }
    } catch (error: unknown) {
      if (isApiRequestError(error)) {
        setSuggestError({
          message: error.message,
          problem: error.problem,
          correlationId: error.correlationId,
        });
      } else {
        setSuggestError({
          message: error instanceof Error ? error.message : "Could not suggest structured brief items.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setSuggestBusy(false);
    }
  }

  useEffect(() => {
    if (props.suggestFromOverviewNonce === undefined || props.suggestFromOverviewNonce < 1) {
      return;
    }

    void onSuggestFromOverview();
  }, [props.suggestFromOverviewNonce]);

  async function onSuggestFailureMode(): Promise<void> {
    if (!canSuggestFailureMode) {
      return;
    }

    setFailureModeSuggestBusy(true);
    setFailureModeSuggestError(null);
    setFailureModeSuggestEmpty(false);
    setFailureModeSuggestApplied(false);

    try {
      const response = await draftArchitectureRequest({
        freeTextDescription: failureModeSourceText,
        currentConstraints: [...brief.confirmedConstraints, ...brief.suggestedConstraints],
        currentAssumptions: [...brief.confirmedAssumptions, ...brief.suggestedAssumptions],
      });
      const failureModeSuggestion = resolveFailureModeSuggestion({
        llmSuggestion: response.suggestedFailureModeNote,
        sourceText: failureModeSourceText,
      });
      const applied = applyFailureModeSuggestionIfEmpty(brief, failureModeSuggestion);

      props.onStructuredBriefChange(applied.brief);
      setFailureModeSuggestApplied(applied.applied);
      setFailureModeSuggestEmpty(!applied.applied && (failureModeSuggestion?.trim().length ?? 0) === 0);
    } catch (error: unknown) {
      if (isApiRequestError(error)) {
        setFailureModeSuggestError({
          message: error.message,
          problem: error.problem,
          correlationId: error.correlationId,
        });
      } else {
        setFailureModeSuggestError({
          message: error instanceof Error ? error.message : "Could not suggest failure mode and recovery.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setFailureModeSuggestBusy(false);
    }
  }

  const qualityInvalid = markInvalid && !qualityAttributeMeetsMinimum(brief.qualityAttribute);

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
            disabled={!canSuggestFromOverview}
            onClick={() => {
              void onSuggestFromOverview();
            }}
            data-testid="architecture-draft-suggest-structured-brief"
          >
            {suggestBusy ? "Suggesting…" : "Suggest from overview"}
          </Button>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
            Suggestions stay unconfirmed until you add or confirm them.
          </p>
        </div>
        {!canSuggestFromOverview && props.blocksLlmExecution === true ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
            role="status"
            data-testid="architecture-draft-suggest-structured-brief-budget-blocked"
          >
            Monthly AI budget is exhausted — suggestions are paused until the budget resets or your admin raises the limit.
          </p>
        ) : null}
        {!canSuggestFromOverview
        && props.blocksLlmExecution !== true
        && overviewTrimmedLength < ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-500")}
            role="status"
            data-testid="architecture-draft-suggest-structured-brief-disabled-hint"
          >
            {guidedIntakeStructuredBriefSuggestDisabledHint(overviewTrimmedLength)}
          </p>
        ) : null}
        {!canSuggestFromOverview && props.disabled === true && props.blocksLlmExecution !== true
        && overviewTrimmedLength >= ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS
        && !suggestBusy ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
            role="status"
            data-testid="architecture-draft-suggest-structured-brief-editor-locked-hint"
          >
            {GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EDITOR_LOCKED_HINT}
          </p>
        ) : null}
        {suggestAddedCount !== null && suggestAddedCount > 0 ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-emerald-800 dark:text-emerald-200")}
            role="status"
            data-testid="architecture-draft-suggest-structured-brief-success"
          >
            {guidedIntakeStructuredBriefSuggestSuccess(suggestAddedCount)}
          </p>
        ) : null}
        {suggestEmpty ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}
            role="status"
            data-testid="architecture-draft-suggest-structured-brief-empty"
          >
            {GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_EMPTY}
          </p>
        ) : null}
        {suggestError !== null ? (
          <OperatorApiProblem
            problem={suggestError.problem}
            fallbackMessage={suggestError.message}
            correlationId={suggestError.correlationId}
          />
        ) : null}
      </div>

      <StructuredBriefCapabilitiesQualityVocabularyRail currentSurfaceId="architecture-draft-structured-brief" />

      <ConfirmableChipList
        label="Constraints"
        hint="Hard limits the architecture must not violate — budget, regions, compliance. Leave empty if none are stated."
        inputId="architecture-draft-constraints"
        items={brief.confirmedConstraints}
        suggestedItems={brief.suggestedConstraints}
        suggestionKind="Constraint"
        suggestionSourceText={failureModeSourceText}
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

      <ConfirmableChipList
        label="Assumptions"
        hint="Facts agents may rely on unless evidence contradicts them. Leave empty if none are stated."
        inputId="architecture-draft-assumptions"
        items={brief.confirmedAssumptions}
        suggestedItems={brief.suggestedAssumptions}
        suggestionKind="Assumption"
        suggestionSourceText={failureModeSourceText}
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
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedAssumptions", "suggestedAssumptions", value);
        }}
        onDenySuggested={(value) => {
          denySuggested("suggestedAssumptions", value);
        }}
      />

      <ConfirmableChipList
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_HINT}
        inputId="architecture-draft-capabilities"
        items={brief.confirmedRequiredCapabilities}
        suggestedItems={brief.suggestedRequiredCapabilities}
        suggestionKind="RequiredCapability"
        suggestionSourceText={failureModeSourceText}
        invalid={false}
        required={false}
        disabled={props.disabled === true}
        helpSlug="structured-brief"
        helpHashFragment="field-concepts"
        helpLabel="Read required capabilities help"
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

      <ConfirmableChipList
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_HINT}
        inputId="architecture-draft-quality-attributes"
        inputPlaceholder={GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_PLACEHOLDER}
        items={parseQualityAttributeEntries(brief.qualityAttribute)}
        suggestedItems={[]}
        invalid={qualityInvalid}
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

      <IntakeTextField
        id="architecture-draft-failure-mode"
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_HINT}
        required={false}
        value={brief.failureModeNote}
        placeholder={GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_PLACEHOLDER}
        disabled={props.disabled === true}
        testId="architecture-draft-failure-mode"
        onChange={(value) => {
          updateBrief({ failureModeNote: value });
        }}
      />

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
