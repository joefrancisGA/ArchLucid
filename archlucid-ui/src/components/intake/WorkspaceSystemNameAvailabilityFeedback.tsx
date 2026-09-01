"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_FORM_FIELD_HELPER_CLASS } from "@/lib/design-tokens";
import {
  WORKSPACE_SYSTEM_NAME_CHECKING_HELPER,
  WORKSPACE_SYSTEM_NAME_CONFLICT_RECOVERY_HELPER,
} from "@/lib/workspace-system-name-availability-copy";
import type { WorkspaceSystemNameAvailabilityState } from "@/hooks/use-workspace-system-name-availability";
import { WORKSPACE_SYSTEM_NAME_VALIDATION_UNAVAILABLE_HELPER } from "@/hooks/use-workspace-system-name-availability";

type WorkspaceSystemNameAvailabilityFeedbackProps = {
  readonly availability: WorkspaceSystemNameAvailabilityState;
  readonly testId?: string;
};

/** Inline helper/error copy under a system or review name field. */
export function WorkspaceSystemNameAvailabilityFeedback(
  props: WorkspaceSystemNameAvailabilityFeedbackProps,
): React.JSX.Element | null {
  const { availability } = props;
  const testId = props.testId ?? "workspace-system-name-availability-feedback";

  if (availability.validating) {
    return (
      <p
        className={cn(OPERATOR_FORM_FIELD_HELPER_CLASS, "text-neutral-600 dark:text-neutral-400")}
        role="status"
        data-testid={testId}
      >
        {WORKSPACE_SYSTEM_NAME_CHECKING_HELPER}
      </p>
    );
  }

  if (availability.validationUnavailable) {
    return (
      <p
        className={cn(OPERATOR_FORM_FIELD_HELPER_CLASS, "text-neutral-600 dark:text-neutral-400")}
        role="status"
        data-testid={testId}
      >
        {WORKSPACE_SYSTEM_NAME_VALIDATION_UNAVAILABLE_HELPER}
      </p>
    );
  }

  if (availability.validationReady && !availability.isAvailable && availability.conflictMessage !== null) {
    return (
      <div data-testid={testId}>
        <p
          className={cn(OPERATOR_FORM_FIELD_HELPER_CLASS, "text-rose-700 dark:text-rose-300")}
          role="alert"
          data-testid={`${testId}-conflict`}
        >
          {availability.conflictMessage}
        </p>
        <p className={cn(OPERATOR_FORM_FIELD_HELPER_CLASS, "text-neutral-600 dark:text-neutral-400")}>
          {WORKSPACE_SYSTEM_NAME_CONFLICT_RECOVERY_HELPER}
        </p>
      </div>
    );
  }

  return null;
}
