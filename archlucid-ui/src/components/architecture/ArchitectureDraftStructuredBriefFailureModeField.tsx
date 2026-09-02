"use client";

import type { Dispatch, SetStateAction } from "react";

import { IntakeTextField } from "@/components/intake/IntakeTextField";
import { Button } from "@/components/ui/button";
import {
  confirmFailureModeSuggestion,
  denyFailureModeSuggestion,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_CONFIRM_ACTOR_BUTTON,
  GUIDED_INTAKE_DENY_SUGGESTION_BUTTON,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_PLACEHOLDER,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_HEADING,
} from "@/lib/guided-intake-copy";
import { cn } from "@/lib/utils";

export type ArchitectureDraftStructuredBriefFailureModeFieldProps = {
  readonly brief: ArchitectureDraftStructuredBriefState;
  readonly disabled?: boolean;
  readonly onStructuredBriefChange: Dispatch<SetStateAction<ArchitectureDraftStructuredBriefState>>;
  readonly onBriefConfirmOrDeny?: () => void;
};

export function ArchitectureDraftStructuredBriefFailureModeField(
  props: ArchitectureDraftStructuredBriefFailureModeFieldProps,
): React.JSX.Element {
  const { brief } = props;

  return (
    <div className="space-y-2" data-testid="architecture-draft-failure-mode">
      <IntakeTextField
        id="architecture-draft-failure-mode"
        label={GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_LABEL}
        hint={GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_HINT}
        required={false}
        showRequirednessSuffix={false}
        value={brief.failureModeNote}
        placeholder={GUIDED_INTAKE_STRUCTURED_BRIEF_FAILURE_MODE_PLACEHOLDER}
        disabled={props.disabled === true}
        testId="architecture-draft-failure-mode-input"
        onChange={(value) => {
          props.onStructuredBriefChange((current) => ({
            ...current,
            failureModeNote: value,
            suggestedFailureModeNote:
              value.trim().length > 0 ? "" : current.suggestedFailureModeNote,
          }));
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
  );
}
