"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PREFERENCE_SAVED_TO_ACCOUNT_MESSAGE } from "@/lib/preferences-account-sync-copy";
import { cn } from "@/lib/utils";

export type PreferenceAccountSyncState = "idle" | "synced" | "local-only";

export type PreferenceAccountSyncStatusProps = {
  readonly accountSyncState: PreferenceAccountSyncState;
  readonly localOnlyMessage: string;
  readonly testIdPrefix: string;
  readonly syncedMessage?: string;
};

/** Polite saved confirmation and alert-style local-only fallback for preference panels. */
export function PreferenceAccountSyncStatus(props: PreferenceAccountSyncStatusProps): React.JSX.Element | null {
  if (props.accountSyncState === "idle") {
    return null;
  }

  if (props.accountSyncState === "synced") {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        role="status"
        aria-live="polite"
        data-testid={`${props.testIdPrefix}-sync-status`}
      >
        {props.syncedMessage ?? PREFERENCE_SAVED_TO_ACCOUNT_MESSAGE}
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
