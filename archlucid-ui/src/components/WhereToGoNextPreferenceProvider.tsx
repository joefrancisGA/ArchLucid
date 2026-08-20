"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_WHERE_TO_GO_NEXT_ENABLED,
  persistWhereToGoNextEnabled,
  readWhereToGoNextEnabledFromStorage,
  syncWhereToGoNextEnabledFromServer,
} from "@/lib/where-to-go-next-preference";

export type WhereToGoNextAccountSyncState = "idle" | "synced" | "local-only";

type WhereToGoNextPreferenceContextValue = {
  readonly enabled: boolean;
  readonly mounted: boolean;
  readonly accountSyncState: WhereToGoNextAccountSyncState;
  readonly setAndPersist: (enabled: boolean) => void;
};

const WhereToGoNextPreferenceContext = createContext<WhereToGoNextPreferenceContextValue | null>(null);

/** Single source of truth for Where to go next follow-up strip visibility. */
export function WhereToGoNextPreferenceProvider(props: { readonly children: ReactNode }) {
  const [enabled, setEnabled] = useState<boolean>(DEFAULT_WHERE_TO_GO_NEXT_ENABLED);
  const [mounted, setMounted] = useState(false);
  const [accountSyncState, setAccountSyncState] = useState<WhereToGoNextAccountSyncState>("idle");

  useEffect(() => {
    setEnabled(readWhereToGoNextEnabledFromStorage());
    setMounted(true);

    void syncWhereToGoNextEnabledFromServer().then((syncedEnabled) => {
      if (syncedEnabled === null) {
        return;
      }

      setEnabled(syncedEnabled);
      setAccountSyncState("synced");
    });
  }, []);

  const setAndPersist = useCallback((nextEnabled: boolean) => {
    setEnabled(nextEnabled);
    void persistWhereToGoNextEnabled(nextEnabled).then((synced) => {
      setAccountSyncState(synced ? "synced" : "local-only");
    });
  }, []);

  const value = useMemo<WhereToGoNextPreferenceContextValue>(
    () => ({
      enabled,
      mounted,
      accountSyncState,
      setAndPersist,
    }),
    [accountSyncState, enabled, mounted, setAndPersist],
  );

  return (
    <WhereToGoNextPreferenceContext.Provider value={value}>
      {props.children}
    </WhereToGoNextPreferenceContext.Provider>
  );
}

export function useWhereToGoNextPreference(): WhereToGoNextPreferenceContextValue {
  const context = useContext(WhereToGoNextPreferenceContext);

  if (context === null) {
    throw new Error("useWhereToGoNextPreference must be used within WhereToGoNextPreferenceProvider.");
  }

  return context;
}

/** When no provider is mounted (tests, marketing), follow-up strips stay visible. */
export function useWhereToGoNextVisible(): boolean {
  const context = useContext(WhereToGoNextPreferenceContext);

  if (context === null) {
    return DEFAULT_WHERE_TO_GO_NEXT_ENABLED;
  }

  return context.enabled;
}
