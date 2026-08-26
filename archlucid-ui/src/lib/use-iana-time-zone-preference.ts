"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const userTouchedRef = useRef(false);

  useEffect(() => {
    setIanaTimeZoneId(readStoredIanaTimeZonePreference());
    setMounted(true);

    void syncIanaTimeZonePreferenceFromServer().then((syncedTimeZoneId) => {
      if (syncedTimeZoneId === null) {
        return;
      }

      if (!userTouchedRef.current) {
        setIanaTimeZoneId(syncedTimeZoneId);
      }

      setAccountSyncState("synced");
    });
  }, []);

  const setAndPersist = useCallback((nextIanaTimeZoneId: string) => {
    userTouchedRef.current = true;
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
