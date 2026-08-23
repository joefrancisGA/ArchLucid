"use client";

import { useCallback, useEffect, useState } from "react";

import {
  persistIanaTimeZonePreference,
  readStoredIanaTimeZonePreference,
  syncIanaTimeZonePreferenceFromServer,
} from "@/lib/iana-time-zone-preference";

export type IanaTimeZonePreferenceAccountSyncState = "idle" | "synced" | "local-only";

export function useIanaTimeZonePreference(): {
  readonly ianaTimeZoneId: string;
  readonly mounted: boolean;
  readonly accountSyncState: IanaTimeZonePreferenceAccountSyncState;
  readonly setAndPersist: (nextIanaTimeZoneId: string) => void;
} {
  const [ianaTimeZoneId, setIanaTimeZoneId] = useState<string>("UTC");
  const [mounted, setMounted] = useState(false);
  const [accountSyncState, setAccountSyncState] = useState<IanaTimeZonePreferenceAccountSyncState>("idle");

  useEffect(() => {
    setIanaTimeZoneId(readStoredIanaTimeZonePreference());
    setMounted(true);

    void syncIanaTimeZonePreferenceFromServer().then((syncedTimeZoneId) => {
      if (syncedTimeZoneId === null) {
        return;
      }

      setIanaTimeZoneId(syncedTimeZoneId);
    });
  }, []);

  const setAndPersist = useCallback((nextIanaTimeZoneId: string) => {
    setIanaTimeZoneId(nextIanaTimeZoneId);
    void persistIanaTimeZonePreference(nextIanaTimeZoneId).then((synced) => {
      setAccountSyncState(synced ? "synced" : "local-only");
    });
  }, []);

  return {
    ianaTimeZoneId,
    mounted,
    accountSyncState,
    setAndPersist,
  };
}
