"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_FORM_CONTROL_DESCRIPTION_GAP_CLASS, OPERATOR_FORM_FIELD_HELPER_CLASS, OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_FORM_FIELD_STACK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  FOCUSED_PILOT_MODE_COPY,
  FOCUSED_PILOT_MODE_CREATION_COPY,
  FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES,
} from "@/lib/focused-pilot-mode-policy-packs";

type PilotModePolicyPackToggleProps = {
  readonly enabled: boolean;
  readonly onEnabledChange: (enabled: boolean) => void;
  readonly className?: string;
  readonly testId?: string;
  readonly presentation?: "checkbox" | "scope-card" | "choice";
};

/** Both review-scope outcomes stated as peers, so neither option is expressed as a negation of the other. */
const REVIEW_SCOPE_CHOICES: readonly {
  id: "recommended" | "all";
  focused: boolean;
  label: string;
  description: string;
}[] = [
  {
    id: "recommended",
    focused: true,
    label: FOCUSED_PILOT_MODE_COPY.choiceRecommendedLabel,
    description: FOCUSED_PILOT_MODE_COPY.choiceRecommendedDescription,
  },
  {
    id: "all",
    focused: false,
    label: FOCUSED_PILOT_MODE_COPY.choiceAllLabel,
    description: FOCUSED_PILOT_MODE_COPY.choiceAllDescription,
  },
];

function FocusedPilotModeCheckbox(props: PilotModePolicyPackToggleProps): React.JSX.Element {
  const { enabled, onEnabledChange, className, testId = "pilot-mode-policy-pack-toggle" } = props;
  const inputId = `${testId}-input`;

  return (
    <div className={cn(OPERATOR_FORM_FIELD_STACK_CLASS, className)} data-testid={`${testId}-wrap`}>
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer items-start rounded-md border border-neutral-200 px-3 py-2 text-neutral-800 dark:border-neutral-700 dark:text-neutral-100",
          OPERATOR_FORM_CONTROL_DESCRIPTION_GAP_CLASS,
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        <input
          id={inputId}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
          data-testid={testId}
          checked={enabled}
          aria-label={
            enabled
              ? `${FOCUSED_PILOT_MODE_COPY.toggleLabel} — on. ${FOCUSED_PILOT_MODE_COPY.toggleAssistiveOn}`
              : `${FOCUSED_PILOT_MODE_COPY.toggleLabel} — off. ${FOCUSED_PILOT_MODE_COPY.toggleAssistiveOff}`
          }
          onChange={(event) => {
            onEnabledChange(event.target.checked);
          }}
        />
        <span className="min-w-0 leading-snug">
          <span className="block font-medium">{FOCUSED_PILOT_MODE_COPY.toggleLabel}</span>
          <span className={cn("block font-normal text-neutral-600 dark:text-neutral-400", OPERATOR_FORM_FIELD_HELPER_CLASS)}>
            {FOCUSED_PILOT_MODE_COPY.toggleDescription}
          </span>
        </span>
      </label>
    </div>
  );
}

function FocusedPilotModeScopeCard(props: PilotModePolicyPackToggleProps): React.JSX.Element {
  const { enabled, onEnabledChange, className, testId = "pilot-mode-policy-pack-toggle" } = props;
  const inputId = `${testId}-input`;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn("space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700", className)}
      data-testid={`${testId}-wrap`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {FOCUSED_PILOT_MODE_CREATION_COPY.sectionLabel}
        </p>
        {!expanded ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-auto px-2 py-1"
            data-testid={`${testId}-change-focus`}
            onClick={() => {
              setExpanded(true);
            }}
          >
            {FOCUSED_PILOT_MODE_CREATION_COPY.changeFocusAction}
          </Button>
        ) : null}
      </div>

      {enabled ? (
        <ul
          className="m-0 flex list-none flex-wrap gap-2 p-0"
          aria-label="Selected review standards"
          data-testid={`${testId}-selected-standards`}
        >
          {FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES.map((packName) => (
            <li
              key={packName}
              className={cn(
                "rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-teal-900 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-100",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              {packName}
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          All enabled standards may contribute findings.
        </p>
      )}

      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {enabled
          ? FOCUSED_PILOT_MODE_CREATION_COPY.focusedDescription
          : FOCUSED_PILOT_MODE_CREATION_COPY.expandedDescription}
      </p>

      {expanded ? (
        <label
          htmlFor={inputId}
          className={cn("flex cursor-pointer items-start", OPERATOR_FORM_CONTROL_DESCRIPTION_GAP_CLASS, OPERATOR_TYPOGRAPHY.helper)}
        >
          <input
            id={inputId}
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
            data-testid={testId}
            checked={enabled}
            aria-label={
              enabled
                ? `${FOCUSED_PILOT_MODE_CREATION_COPY.sectionLabel} — focused. ${FOCUSED_PILOT_MODE_CREATION_COPY.focusedAssistiveOn}`
                : `${FOCUSED_PILOT_MODE_CREATION_COPY.sectionLabel} — all standards. ${FOCUSED_PILOT_MODE_CREATION_COPY.focusedAssistiveOff}`
            }
            onChange={(event) => {
              onEnabledChange(event.target.checked);
            }}
          />
          <span className="min-w-0 leading-snug">
            <span className="block font-medium text-neutral-900 dark:text-neutral-100">
              Limit to selected standards
            </span>
            <span className={cn("block font-normal text-neutral-600 dark:text-neutral-400", OPERATOR_FORM_FIELD_HELPER_CLASS)}>
              {FOCUSED_PILOT_MODE_COPY.toggleDescription}
            </span>
          </span>
        </label>
      ) : null}
    </div>
  );
}

function FocusedPilotModeChoiceGroup(props: PilotModePolicyPackToggleProps): React.JSX.Element {
  const { enabled, onEnabledChange, className, testId = "pilot-mode-policy-pack-toggle" } = props;

  return (
    <fieldset className={cn(OPERATOR_FORM_FIELD_STACK_CLASS, className)} data-testid={`${testId}-wrap`}>
      <legend className={OPERATOR_FORM_FIELD_LABEL_CLASS}>{FOCUSED_PILOT_MODE_COPY.choiceLegend}</legend>
      <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
        {REVIEW_SCOPE_CHOICES.map((choice) => (
          <label
            key={choice.id}
            htmlFor={`${testId}-${choice.id}`}
            className={cn(
              "flex cursor-pointer items-start rounded-md border px-3 py-2",
              OPERATOR_FORM_CONTROL_DESCRIPTION_GAP_CLASS,
              OPERATOR_TYPOGRAPHY.helper,
              choice.focused === enabled
                ? "border-[var(--al-accent-interactive)] bg-al-surface-raised"
                : "border-neutral-200 dark:border-neutral-700",
            )}
          >
            <input
              id={`${testId}-${choice.id}`}
              type="radio"
              name={`${testId}-review-scope`}
              className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
              data-testid={`${testId}-${choice.id}`}
              checked={choice.focused === enabled}
              onChange={() => {
                onEnabledChange(choice.focused);
              }}
            />
            <span className="min-w-0 leading-snug">
              <span className="block font-medium text-al-text-primary">{choice.label}</span>
              <span className={cn("block font-normal text-al-text-secondary", OPERATOR_FORM_FIELD_HELPER_CLASS)}>
                {choice.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Limits review policy evaluation to security baseline + cost packs for first-pilot time-to-value. */
export function PilotModePolicyPackToggle(props: PilotModePolicyPackToggleProps): React.JSX.Element {
  if (props.presentation === "scope-card") {
    return <FocusedPilotModeScopeCard {...props} />;
  }

  if (props.presentation === "choice") {
    return <FocusedPilotModeChoiceGroup {...props} />;
  }

  return <FocusedPilotModeCheckbox {...props} />;
}
