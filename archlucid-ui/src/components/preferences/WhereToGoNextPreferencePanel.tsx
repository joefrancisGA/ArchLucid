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
  /** Card title id when the panel is rendered inside a CardHeader (avoids duplicate headings). */
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
