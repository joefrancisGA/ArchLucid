"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PREFERENCES_WHERE_TO_GO_NEXT_HEADING,
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
};

export function WhereToGoNextPreferencePanel({
  enabled,
  onEnabledChange,
  accountSyncState = "idle",
}: WhereToGoNextPreferencePanelProps) {
  const checkboxId = "where-to-go-next-enabled";

  return (
    <section
      className="space-y-3"
      data-testid="where-to-go-next-preference-panel"
      aria-labelledby="where-to-go-next-preference-heading"
    >
      <div>
        <h2 id="where-to-go-next-preference-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {PREFERENCES_WHERE_TO_GO_NEXT_HEADING}
        </h2>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {PREFERENCES_WHERE_TO_GO_NEXT_LEAD}
        </p>
      </div>
      <label
        htmlFor={checkboxId}
        className={cn(
          "flex min-h-6 cursor-pointer items-center gap-3",
          OPERATOR_TYPOGRAPHY.body,
          "text-al-text-primary",
        )}
      >
        <Checkbox
          id={checkboxId}
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(checked === true)}
          data-testid="where-to-go-next-enabled"
          className={cn(
            "h-6 w-6 shrink-0 rounded border-2 border-neutral-600 accent-teal-700",
            "data-[state=checked]:border-teal-700 data-[state=checked]:bg-teal-700",
          )}
        />
        <span>{PREFERENCES_WHERE_TO_GO_NEXT_TOGGLE_LABEL}</span>
      </label>
      {accountSyncState === "local-only" ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="where-to-go-next-account-sync-local-only"
        >
          {WHERE_TO_GO_NEXT_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE}
        </p>
      ) : null}
    </section>
  );
}
