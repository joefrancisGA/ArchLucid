"use client";

import { PreferenceAccountSyncStatus } from "@/components/preferences/PreferenceAccountSyncStatus";
import { PreferenceCheckbox } from "@/components/preferences/PreferenceCheckbox";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PREFERENCES_WHERE_TO_GO_NEXT_LEAD,
  PREFERENCES_WHERE_TO_GO_NEXT_TOGGLE_LABEL,
} from "@/lib/where-to-go-next-preference-copy";
import { WHERE_TO_GO_NEXT_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE } from "@/lib/where-to-go-next-preference";
import type { WhereToGoNextAccountSyncState } from "@/components/WhereToGoNextPreferenceProvider";
import { cn } from "@/lib/utils";

export type WhereToGoNextPreferencePanelProps = {
  readonly enabled: boolean;
  readonly onEnabledChange: (enabled: boolean) => void;
  readonly accountSyncState?: WhereToGoNextAccountSyncState;
  readonly labelledById?: string;
};

export function WhereToGoNextPreferencePanel({
  enabled,
  onEnabledChange,
  accountSyncState = "idle",
  labelledById,
}: WhereToGoNextPreferencePanelProps) {
  const checkboxId = "where-to-go-next-enabled";

  return (
    <section
      className="space-y-3"
      data-testid="where-to-go-next-preference-panel"
      aria-labelledby={labelledById}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{PREFERENCES_WHERE_TO_GO_NEXT_LEAD}</p>
      <label
        htmlFor={checkboxId}
        className={cn(
          "flex min-h-6 cursor-pointer items-center gap-3",
          OPERATOR_TYPOGRAPHY.body,
          "text-al-text-primary",
        )}
      >
        <PreferenceCheckbox
          id={checkboxId}
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(checked === true)}
          data-testid="where-to-go-next-enabled"
        />
        <span>{PREFERENCES_WHERE_TO_GO_NEXT_TOGGLE_LABEL}</span>
      </label>
      <PreferenceAccountSyncStatus
        accountSyncState={accountSyncState}
        localOnlyMessage={WHERE_TO_GO_NEXT_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE}
        testIdPrefix="where-to-go-next"
      />
    </section>
  );
}
