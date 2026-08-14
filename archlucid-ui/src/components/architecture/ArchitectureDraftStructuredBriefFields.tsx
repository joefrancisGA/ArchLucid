"use client";

import { useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { draftArchitectureRequest } from "@/lib/api/architecture-request-draft-api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
  mergeUniqueStrings,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ListFieldKey =
  | "confirmedConstraints"
  | "confirmedAssumptions"
  | "confirmedRequiredCapabilities";

type SuggestedFieldKey =
  | "suggestedConstraints"
  | "suggestedAssumptions"
  | "suggestedRequiredCapabilities";

type ArchitectureDraftStructuredBriefFieldsProps = {
  readonly structuredBrief: ArchitectureDraftStructuredBriefState;
  readonly freeTextIntent: string;
  readonly disabled?: boolean;
  readonly markReviewReadinessInvalid?: boolean;
  readonly onStructuredBriefChange: (brief: ArchitectureDraftStructuredBriefState) => void;
};

function ConfirmableChipList(props: {
  readonly label: string;
  readonly hint: string;
  readonly inputId: string;
  readonly items: readonly string[];
  readonly suggestedItems: readonly string[];
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly onAdd: (value: string) => void;
  readonly onRemove: (index: number) => void;
  readonly onConfirmSuggested: (value: string) => void;
}): React.JSX.Element {
  const [draft, setDraft] = useState("");

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
      <Label htmlFor={`${props.inputId}-input`} className="font-semibold text-neutral-900 dark:text-neutral-100">
        {props.label}
        <span className={cn("font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {" "}
          (required)
        </span>
      </Label>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>{props.hint}</p>
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
          disabled={props.disabled}
          className="max-w-md min-w-[12rem] flex-1"
          placeholder="Type and Add"
          aria-invalid={props.invalid}
        />
        <Button type="button" variant="secondary" size="sm" disabled={props.disabled} onClick={addDraft}>
          Add
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={props.disabled}
          onClick={() => {
            props.onAdd(ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL);
          }}
        >
          Mark unknown
        </Button>
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
                    disabled={props.disabled}
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
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-500")}>No confirmed items yet.</p>
      )}
    </div>
  );
}

/** Structured brief lists and quality notes for architecture draft review readiness (TB-2282). */
export function ArchitectureDraftStructuredBriefFields(
  props: ArchitectureDraftStructuredBriefFieldsProps,
): React.JSX.Element {
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestError, setSuggestError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const markInvalid = props.markReviewReadinessInvalid === true;
  const brief = props.structuredBrief;

  const updateBrief = (partial: Partial<ArchitectureDraftStructuredBriefState>) => {
    props.onStructuredBriefChange({ ...brief, ...partial });
  };

  const updateList = (key: ListFieldKey, items: string[]) => {
    updateBrief({ [key]: items });
  };

  const removeFromSuggested = (key: SuggestedFieldKey, value: string) => {
    updateBrief({
      [key]: brief[key].filter((item) => item !== value),
    });
  };

  const confirmSuggested = (
    confirmedKey: ListFieldKey,
    suggestedKey: SuggestedFieldKey,
    value: string,
  ) => {
    updateBrief({
      [confirmedKey]: mergeUniqueStrings(brief[confirmedKey], [value]),
      [suggestedKey]: brief[suggestedKey].filter((item) => item !== value),
    });
  };

  async function onSuggestFromOverview(): Promise<void> {
    const freeTextDescription = props.freeTextIntent.trim();

    if (freeTextDescription.length < 20 || suggestBusy) {
      return;
    }

    setSuggestBusy(true);
    setSuggestError(null);

    try {
      const response = await draftArchitectureRequest({ freeTextDescription });

      updateBrief({
        suggestedConstraints: mergeUniqueStrings(brief.suggestedConstraints, response.suggestedConstraints ?? []),
        suggestedAssumptions: mergeUniqueStrings(brief.suggestedAssumptions, response.suggestedAssumptions ?? []),
        suggestedRequiredCapabilities: mergeUniqueStrings(
          brief.suggestedRequiredCapabilities,
          response.suggestedCapabilities ?? [],
        ),
      });
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

  const qualityInvalid = markInvalid && !/\d/.test(brief.qualityAttribute.trim());

  return (
    <div className="space-y-6" data-testid="architecture-draft-structured-brief-fields">
      <div className="space-y-2">
        <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          Structured brief
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
          Confirm constraints and assumptions so review engines do not invent them from free text alone.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={props.disabled === true || suggestBusy || props.freeTextIntent.trim().length < 20}
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
        {suggestError !== null ? (
          <OperatorApiProblem
            problem={suggestError.problem}
            fallbackMessage={suggestError.message}
            correlationId={suggestError.correlationId}
          />
        ) : null}
      </div>

      <ConfirmableChipList
        label="Constraints"
        hint="Hard limits the architecture must not violate — budget, regions, compliance, or mark unknown."
        inputId="architecture-draft-constraints"
        items={brief.confirmedConstraints}
        suggestedItems={brief.suggestedConstraints}
        invalid={markInvalid && brief.confirmedConstraints.every((item) => item.trim().length === 0)}
        disabled={props.disabled === true}
        onAdd={(value) => {
          updateList("confirmedConstraints", mergeUniqueStrings(brief.confirmedConstraints, [value]));
          removeFromSuggested("suggestedConstraints", value);
        }}
        onRemove={(index) => {
          updateList(
            "confirmedConstraints",
            brief.confirmedConstraints.filter((_, itemIndex) => itemIndex !== index),
          );
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
          updateList("confirmedAssumptions", mergeUniqueStrings(brief.confirmedAssumptions, [value]));
          removeFromSuggested("suggestedAssumptions", value);
        }}
        onRemove={(index) => {
          updateList(
            "confirmedAssumptions",
            brief.confirmedAssumptions.filter((_, itemIndex) => itemIndex !== index),
          );
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedAssumptions", "suggestedAssumptions", value);
        }}
      />

      <ConfirmableChipList
        label="Required capabilities"
        hint="Optional — platform traits the design must support."
        inputId="architecture-draft-capabilities"
        items={brief.confirmedRequiredCapabilities}
        suggestedItems={brief.suggestedRequiredCapabilities}
        invalid={false}
        disabled={props.disabled === true}
        onAdd={(value) => {
          updateList("confirmedRequiredCapabilities", mergeUniqueStrings(brief.confirmedRequiredCapabilities, [value]));
          removeFromSuggested("suggestedRequiredCapabilities", value);
        }}
        onRemove={(index) => {
          updateList(
            "confirmedRequiredCapabilities",
            brief.confirmedRequiredCapabilities.filter((_, itemIndex) => itemIndex !== index),
          );
        }}
        onConfirmSuggested={(value) => {
          confirmSuggested("confirmedRequiredCapabilities", "suggestedRequiredCapabilities", value);
        }}
      />

      <div className="space-y-2">
        <Label htmlFor="architecture-draft-quality-attribute" className="font-semibold text-neutral-900 dark:text-neutral-100">
          Quality attribute
          <span className={cn("font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {" "}
            (required)
          </span>
        </Label>
        <Input
          id="architecture-draft-quality-attribute"
          value={brief.qualityAttribute}
          onChange={(event) => {
            updateBrief({ qualityAttribute: event.target.value });
          }}
          disabled={props.disabled === true}
          placeholder="e.g. RTO 4h, RPO 15m, p95 latency 200ms, 5k req/s"
          data-testid="architecture-draft-quality-attribute"
          aria-invalid={qualityInvalid}
        />
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
          Include at least one number — RTO/RPO, latency, volume, or cost ceiling.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="architecture-draft-failure-mode" className="font-semibold text-neutral-900 dark:text-neutral-100">
          Failure mode / continuity
          <span className={cn("font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {" "}
            (optional)
          </span>
        </Label>
        <Textarea
          id="architecture-draft-failure-mode"
          rows={2}
          value={brief.failureModeNote}
          onChange={(event) => {
            updateBrief({ failureModeNote: event.target.value });
          }}
          disabled={props.disabled === true}
          placeholder="What breaks first and how operators recover."
          data-testid="architecture-draft-failure-mode"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="architecture-draft-operational-owner" className="font-semibold text-neutral-900 dark:text-neutral-100">
          Operational owner
          <span className={cn("font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {" "}
            (optional)
          </span>
        </Label>
        <Input
          id="architecture-draft-operational-owner"
          value={brief.operationalOwner}
          onChange={(event) => {
            updateBrief({ operationalOwner: event.target.value });
          }}
          disabled={props.disabled === true}
          placeholder="Team or role accountable for runbooks and on-call."
          data-testid="architecture-draft-operational-owner"
        />
      </div>
    </div>
  );
}
