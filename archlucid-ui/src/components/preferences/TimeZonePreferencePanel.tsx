"use client";

import { useMemo } from "react";

import { PreferenceAccountSyncStatus } from "@/components/preferences/PreferenceAccountSyncStatus";
import {
  formatIanaTimeZoneOptionLabel,
  getIanaTimeZoneSelectOptions,
  normalizeIanaTimeZoneForSelect,
  toStoredIanaTimeZoneId,
} from "@/lib/iana-time-zone-select";
import {
  IANA_TIME_ZONE_PREFERENCE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE,
  PREFERENCES_TIME_ZONE_LEAD,
} from "@/lib/iana-time-zone-preference-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { IanaTimeZonePreferenceAccountSyncState } from "@/lib/use-iana-time-zone-preference";
import { cn } from "@/lib/utils";

const SELECT_CLASS = cn(
  "flex h-9 w-full max-w-md rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-neutral-600",
  OPERATOR_TYPOGRAPHY.body,
);

export type TimeZonePreferencePanelProps = {
  readonly ianaTimeZoneId: string;
  readonly onIanaTimeZoneIdChange: (nextIanaTimeZoneId: string) => void;
  readonly accountSyncState?: IanaTimeZonePreferenceAccountSyncState;
  readonly labelledById?: string;
  readonly selectId?: string;
};

export function TimeZonePreferencePanel({
  ianaTimeZoneId,
  onIanaTimeZoneIdChange,
  accountSyncState = "idle",
  labelledById,
  selectId = "preferences-time-zone",
}: TimeZonePreferencePanelProps) {
  const ianaOptions = useMemo(() => getIanaTimeZoneSelectOptions(), []);

  return (
    <section className="space-y-3" data-testid="time-zone-preference-panel" aria-labelledby={labelledById}>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{PREFERENCES_TIME_ZONE_LEAD}</p>
      <div className="grid gap-1.5">
        <label htmlFor={selectId} className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Time zone
        </label>
        <select
          id={selectId}
          className={SELECT_CLASS}
          value={normalizeIanaTimeZoneForSelect(ianaTimeZoneId)}
          onChange={(event) => onIanaTimeZoneIdChange(toStoredIanaTimeZoneId(event.target.value))}
          data-testid="time-zone-preference-select"
        >
          {ianaOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {formatIanaTimeZoneOptionLabel(option.value)}
            </option>
          ))}
        </select>
      </div>
      <PreferenceAccountSyncStatus
        accountSyncState={accountSyncState}
        localOnlyMessage={IANA_TIME_ZONE_PREFERENCE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE}
        testIdPrefix="time-zone-preference"
      />
    </section>
  );
}
