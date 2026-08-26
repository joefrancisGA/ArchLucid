"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type PreferenceAccountSyncState = "idle" | "synced" | "local-only";

export type PreferenceAccountSyncStatusProps = {
  readonly accountSyncState: PreferenceAccountSyncState;
  readonly localOnlyMessage: string;
  readonly testIdPrefix: string;
};

/** Alert-style local-only fallback when account sync fails for preference panels. */
export function PreferenceAccountSyncStatus(props: PreferenceAccountSyncStatusProps): React.JSX.Element | null {
  if (props.accountSyncState !== "local-only") {
    return null;
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
