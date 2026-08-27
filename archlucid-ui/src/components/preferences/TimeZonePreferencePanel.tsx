"use client";

import { PreferenceAccountSyncStatus } from "@/components/preferences/PreferenceAccountSyncStatus";
import { IanaTimeZoneCombobox } from "@/components/preferences/IanaTimeZoneCombobox";
import {
  IANA_TIME_ZONE_PREFERENCE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE,
  PREFERENCES_TIME_ZONE_USAGE,
} from "@/lib/iana-time-zone-preference-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { IanaTimeZonePreferenceAccountSyncState } from "@/lib/use-iana-time-zone-preference";
import { cn } from "@/lib/utils";

export type TimeZonePreferencePanelProps = {
  readonly ianaTimeZoneId: string;
  readonly onIanaTimeZoneIdChange: (nextIanaTimeZoneId: string) => void;
  readonly accountSyncState?: IanaTimeZonePreferenceAccountSyncState;
  readonly labelledById?: string;
  readonly controlId?: string;
};

export function TimeZonePreferencePanel({
  ianaTimeZoneId,
  onIanaTimeZoneIdChange,
  accountSyncState = "idle",
  labelledById,
  controlId = "preferences-time-zone",
}: TimeZonePreferencePanelProps) {
  return (
    <section className="space-y-3" data-testid="time-zone-preference-panel" aria-labelledby={labelledById}>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{PREFERENCES_TIME_ZONE_USAGE}</p>
      <div className="grid gap-1.5">
        <span id={`${controlId}-label`} className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Time zone
        </span>
        <IanaTimeZoneCombobox
          ianaTimeZoneId={ianaTimeZoneId}
          onIanaTimeZoneIdChange={onIanaTimeZoneIdChange}
          labelledById={labelledById ?? `${controlId}-label`}
          controlId={controlId}
        />
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Used for dates, audit events, reports, and notifications.
        </p>
      </div>
      <PreferenceAccountSyncStatus
        accountSyncState={accountSyncState}
        localOnlyMessage={IANA_TIME_ZONE_PREFERENCE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE}
        testIdPrefix="time-zone-preference"
      />
    </section>
  );
}
