"use client";

import { useState } from "react";

import { StructuredBriefSuggestionExplainPanel } from "@/components/architecture/StructuredBriefSuggestionExplainPanel";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { IntakeFieldLabel } from "@/components/intake/IntakeFieldLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS } from "@/lib/api/architecture-request-draft-api";
import type { StructuredBriefSuggestionKind } from "@/lib/api/structured-brief-suggestion-explain-api";
import { OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_ASSUMPTION_EVIDENCE_CONTRADICTION_LABEL,
  GUIDED_INTAKE_ASSUMPTION_EVIDENCE_CONTRADICTION_SECTION,
  GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON,
  GUIDED_INTAKE_DENY_SUGGESTION_BUTTON,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_HEADING,
} from "@/lib/guided-intake-copy";
import { cn } from "@/lib/utils";

function StructuredBriefListRow(props: {
  readonly item: string;
  readonly testId?: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <li
      className={cn(
        "space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700",
        props.className,
      )}
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

export type ArchitectureDraftStructuredBriefConfirmableChipListProps = {
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
  readonly evidenceContradictionNotes?: Readonly<Record<string, string>>;
};

export function ArchitectureDraftStructuredBriefConfirmableChipList(
  props: ArchitectureDraftStructuredBriefConfirmableChipListProps,
): React.JSX.Element {
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
      {props.evidenceContradictionNotes !== undefined
      && Object.keys(props.evidenceContradictionNotes).length > 0 ? (
        <p
          className={cn("m-0 rounded-md p-3", OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${props.inputId}-evidence-contradiction-notice`}
        >
          {GUIDED_INTAKE_ASSUMPTION_EVIDENCE_CONTRADICTION_SECTION}
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
                    props.onConfirmSuggested(item);
                  }}
                >
                  {GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON}
                </Button>
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
          {props.items.map((item, index) => {
            const evidenceNote = props.evidenceContradictionNotes?.[item];
            const isContradicted = evidenceNote !== undefined;
            const evidenceNoteText = evidenceNote?.trim() ?? "";

            return (
              <StructuredBriefListRow
                key={`${props.inputId}-${index}-${item.slice(0, 12)}`}
                item={item}
                testId={`${props.inputId}-confirmed`}
                className={isContradicted ? "border-amber-300 dark:border-amber-700" : undefined}
              >
                {isContradicted ? (
                  <p
                    className={cn("m-0 text-amber-900 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid={`${props.inputId}-evidence-contradiction`}
                  >
                    <span className="font-semibold">{GUIDED_INTAKE_ASSUMPTION_EVIDENCE_CONTRADICTION_LABEL}:</span>
                    {" "}
                    {evidenceNoteText.length > 0
                      ? evidenceNoteText
                      : "Revise this assumption or your overview."}
                  </p>
                ) : null}
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
            );
          })}
        </ul>
      ) : (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-neutral-500")}>{emptyMessage}</p>
      )}
    </div>
  );
}
