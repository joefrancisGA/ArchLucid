"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { StructuredBriefCapabilitiesQualityVocabularyRail } from "@/components/StructuredBriefCapabilitiesQualityVocabularyRail";
import { IntakeFieldLabel } from "@/components/intake/IntakeFieldLabel";
import { IntakeTextField } from "@/components/intake/IntakeTextField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { draftArchitectureRequest, ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS } from "@/lib/api/architecture-request-draft-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
  applyIncomingStructuredBriefSuggestions,
  areConfirmedFactControlsDisabled,
  confirmedFactControlsDisabledReason,
  isMarkUnknownControlDisabled,
  joinQualityAttributeEntries,
  markUnknownDisabledReason,
  mergeExclusiveConfirmedItem,
  mergeUniqueStrings,
  parseQualityAttributeEntries,
  qualityAttributeMeetsMinimum,
  type ArchitectureDraftStructuredBriefState,
  type IncomingStructuredBriefSuggestions,
} from "@/lib/architecture/architecture-draft-structured-brief";
import {
  buildArchitectureDraftSuggestionSourceText,
  buildDeterministicStructuredBriefSuggestionsFromText,
  extractQualityAttributeSuggestionsFromText,
} from "@/lib/architecture/architecture-draft-structured-brief-suggestions";
import { OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
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
  guidedIntakeStructuredBriefSuggestDisabledHint,
  guidedIntakeStructuredBriefSuggestSuccess,
} from "@/lib/guided-intake-copy";
import { cn } from "@/lib/utils";

type ListFieldKey =
  | "confirmedConstraints"
  | "confirmedAssumptions"
  | "confirmedRequiredCapabilities";

type SuggestedFieldKey =
  | "suggestedConstraints"
  | "suggestedAssumptions"
  | "suggestedRequiredCapabilities";

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

type ArchitectureDraftStructuredBriefFieldsProps = {
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly freeTextIntent: string;
  readonly systemName?: string;
  readonly businessOutcome?: string;
  readonly disabled?: boolean;
  readonly blocksLlmExecution?: boolean;
  readonly markReviewReadinessInvalid?: boolean;
  readonly onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>;
};

function ConfirmableChipList(props: {
  readonly label: string;
  readonly hint: string;
  readonly inputId: string;
  readonly items: readonly string[];
  readonly suggestedItems: readonly string[];
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly required?: boolean;
  readonly allowMarkUnknown?: boolean;
  readonly inputPlaceholder?: string;
  readonly emptyMessage?: string;
  readonly helpSlug?: string;
  readonly helpHashFragment?: string;
  readonly helpLabel?: string;
  readonly onAdd: (value: string) => void;
  readonly onRemove: (index: number) => void;
  readonly onConfirmSuggested: (value: string) => void;
}): React.JSX.Element {
  const [draft, setDraft] = useState("");
  const isRequired = props.required !== false;
  const allowMarkUnknown = props.allowMarkUnknown !== false;
  const inputPlaceholder = props.inputPlaceholder ?? "Type and Add";
  const emptyMessage = props.emptyMessage ?? "No confirmed items yet.";
  const factControlsDisabled = areConfirmedFactControlsDisabled(
    props.items,
    props.disabled,
    allowMarkUnknown,
  );
  const markUnknownDisabled = isMarkUnknownControlDisabled(props.items, props.disabled);
  const factControlsTitle = confirmedFactControlsDisabledReason(props.items, allowMarkUnknown);
  const markUnknownTitle = markUnknownDisabledReason(props.items);

  const addDraft = () => {
    if (factControlsDisabled) {
      return;
    }

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
      <div className="flex flex-wrap gap-2">
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
          disabled={factControlsDisabled}
          title={factControlsTitle}
          className="max-w-md min-w-[12rem] flex-1"
          placeholder={inputPlaceholder}
          aria-invalid={props.invalid}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={factControlsDisabled}
          title={factControlsTitle}
          data-testid={`${props.inputId}-add`}
          onClick={addDraft}
        >
          Add
        </Button>
        {allowMarkUnknown ? (
          <Button
            type="button"
            variant="outline"
            disabled={markUnknownDisabled}
            title={markUnknownTitle}
            data-testid={`${props.inputId}-mark-unknown`}
            onClick={() => {
              props.onAdd(ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL);
            }}
          >
            Mark unknown
          </Button>
        ) : null}
      </div>
      {props.suggestedItems.length > 0 ? (
        <div className="space-y-1">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
            Suggested — confirm before review uses them.
          </p>
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {props.suggestedItems.map((item) => (
              <li key={`suggested-${props.inputId}-${item}`}>
                <Badge variant="outline" className="gap-1 py-1 pl-2 pr-1 font-normal">
                  <span className="max-w-[240px] truncate">{item}</span>
                  <span
                    className={cn(
                      "rounded bg-violet-100 px-1 font-semibold uppercase tracking-wide text-violet-900 dark:bg-violet-950 dark:text-violet-100",
                      OPERATOR_NAV_GROUP_LABEL,
                    )}
                  >
                    Suggested
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-1"
                    disabled={factControlsDisabled}
                    title={factControlsTitle}
                    onClick={() => {
                      props.onConfirmSuggested(item);
                    }}
                  >
                    Confirm
                  </Button>
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {props.items.length > 0 ? (
        <ul className="flex list-none flex-wrap gap-2 p-0">
          {props.items.map((item, index) => (
            <li key={`${props.inputId}-${index}-${item.slice(0, 12)}`}>
              <Badge variant="outline" className="gap-1 py-1 pl-2 pr-1 font-normal">
                <span className="max-w-[240px] truncate">{item}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-1 text-neutral-600"
                  disabled={props.disabled}
                  onClick={() => {
                    props.onRemove(index);
                  }}
                  aria-label={`Remove ${item}`}
                >
                  ×
                </Button>
              </Badge>
            </li>
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
  const markInvalid = props.markReviewReadinessInvalid === true;
  const brief = props.structuredBrief;
  const overviewTrimmedLength = props.freeTextIntent.trim().length;
  const canSuggestFromOverview =
    overviewTrimmedLength >= ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS
    && props.disabled !== true
    && props.blocksLlmExecution !== true
    && !suggestBusy;

  const updateBrief = (partial: Partial<ArchitectureDraftStructuredBriefState>) => {
    props.onStructuredBriefChange((current) => ({ ...current, ...partial }));
  };

  const confirmSuggested = (
    confirmedKey: ListFieldKey,
    suggestedKey: SuggestedFieldKey,
    value: string,
  ) => {
    confirmSuggestedListItem(props.onStructuredBriefChange, confirmedKey, suggestedKey, value);
  };

  async function onSuggestFromOverview(): Promise<void> {
    const freeTextDescription = buildArchitectureDraftSuggestionSourceText({
      architectureOverview: props.freeTextIntent,
      systemName: props.systemName,
      businessOutcome: props.businessOutcome,
    }).trim();

    if (
      freeTextDescription.length < ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS
      || suggestBusy
      || props.disabled === true
      || props.blocksLlmExecution === true
    ) {
      return;
    }

    setSuggestBusy(true);
    setSuggestError(null);
    setSuggestEmpty(false);
    setSuggestAddedCount(null);

    try {
      const response = await draftArchitectureRequest({ freeTextDescription });
      const incoming: IncomingStructuredBriefSuggestions = {
        suggestedConstraints: response.suggestedConstraints ?? [],
        suggestedAssumptions: response.suggestedAssumptions ?? [],
        suggestedCapabilities: response.suggestedCapabilities ?? [],
      };

      let nextBrief = brief;
      let addedSuggestionCount = 0;

      const llmApplied = applyIncomingStructuredBriefSuggestions(nextBrief, incoming);
      nextBrief = llmApplied.brief;
      addedSuggestionCount += llmApplied.addedSuggestionCount;

      const deterministicApplied = applyIncomingStructuredBriefSuggestions(
        nextBrief,
        buildDeterministicStructuredBriefSuggestionsFromText(freeTextDescription),
      );
      nextBrief = deterministicApplied.brief;
      addedSuggestionCount += deterministicApplied.addedSuggestionCount;

      const qualitySuggestions = extractQualityAttributeSuggestionsFromText(freeTextDescription);

      if (qualitySuggestions.length > 0) {
        const existingQuality = parseQualityAttributeEntries(nextBrief.qualityAttribute);
        const mergedQuality = mergeUniqueStrings(existingQuality, qualitySuggestions);

        if (mergedQuality.length > existingQuality.length) {
          nextBrief = {
            ...nextBrief,
            qualityAttribute: joinQualityAttributeEntries(mergedQuality),
          };
          addedSuggestionCount += mergedQuality.length - existingQuality.length;
        }
      }

      props.onStructuredBriefChange(nextBrief);
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
        hint="Hard limits the architecture must not violate — budget, regions, compliance, or mark unknown."
        inputId="architecture-draft-constraints"
        items={brief.confirmedConstraints}
        suggestedItems={brief.suggestedConstraints}
        invalid={markInvalid && brief.confirmedConstraints.every((item) => item.trim().length === 0)}
        disabled={props.disabled === true}
        onAdd={(value) => {
          addConfirmedListItem(
            props.onStructuredBriefChange,
            "confirmedConstraints",
            "suggestedConstraints",
            value,
          );
        }}
        onRemove={(index) => {
          removeConfirmedListItem(props.onStructuredBriefChange, "confirmedConstraints", index);
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedConstraints", "suggestedConstraints", value);
        }}
      />

      <ConfirmableChipList
        label="Assumptions"
        hint="Facts agents may rely on unless evidence contradicts them — or mark unknown."
        inputId="architecture-draft-assumptions"
        items={brief.confirmedAssumptions}
        suggestedItems={brief.suggestedAssumptions}
        invalid={markInvalid && brief.confirmedAssumptions.every((item) => item.trim().length === 0)}
        disabled={props.disabled === true}
        onAdd={(value) => {
          addConfirmedListItem(
            props.onStructuredBriefChange,
            "confirmedAssumptions",
            "suggestedAssumptions",
            value,
          );
        }}
        onRemove={(index) => {
          removeConfirmedListItem(props.onStructuredBriefChange, "confirmedAssumptions", index);
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedAssumptions", "suggestedAssumptions", value);
        }}
      />

      <ConfirmableChipList
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_HINT}
        inputId="architecture-draft-capabilities"
        items={brief.confirmedRequiredCapabilities}
        suggestedItems={brief.suggestedRequiredCapabilities}
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
        }}
        onRemove={(index) => {
          removeConfirmedListItem(props.onStructuredBriefChange, "confirmedRequiredCapabilities", index);
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedRequiredCapabilities", "suggestedRequiredCapabilities", value);
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
        allowMarkUnknown={false}
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
