"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PREFERENCE_ACCOUNT_SYNCED_MESSAGE } from "@/lib/preference-account-sync-copy";
import { cn } from "@/lib/utils";

export type PreferenceAccountSyncState = "idle" | "synced" | "local-only";

export type PreferenceAccountSyncStatusProps = {
  readonly accountSyncState: PreferenceAccountSyncState;
  readonly localOnlyMessage: string;
  readonly testIdPrefix: string;
};

/** Account sync feedback for preference panels (success + local-only failure). */
export function PreferenceAccountSyncStatus(props: PreferenceAccountSyncStatusProps): React.JSX.Element | null {
  if (props.accountSyncState === "idle") {
    return null;
  }

  if (props.accountSyncState === "synced") {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        aria-live="polite"
        data-testid={`${props.testIdPrefix}-sync-status`}
      >
        {PREFERENCE_ACCOUNT_SYNCED_MESSAGE}
      </p>
    );
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      role="alert"
      data-testid={`${props.testIdPrefix}-sync-status`}
    >
      {props.localOnlyMessage}
    </p>
  );
}
