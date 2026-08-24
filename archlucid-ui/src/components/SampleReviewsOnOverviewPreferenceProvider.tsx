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
  DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED,
  persistSampleReviewsOnOverviewEnabled,
  readSampleReviewsOnOverviewEnabledFromStorage,
  syncSampleReviewsOnOverviewEnabledFromServer,
} from "@/lib/sample-reviews-on-overview-preference";

export type SampleReviewsOnOverviewAccountSyncState = "idle" | "synced" | "local-only";

type SampleReviewsOnOverviewPreferenceContextValue = {
  readonly enabled: boolean;
  readonly mounted: boolean;
  readonly accountSyncState: SampleReviewsOnOverviewAccountSyncState;
  readonly setAndPersist: (enabled: boolean) => void;
};

const SampleReviewsOnOverviewPreferenceContext =
  createContext<SampleReviewsOnOverviewPreferenceContextValue | null>(null);

/** Single source of truth for Overview sample-review visibility. */
export function SampleReviewsOnOverviewPreferenceProvider(props: { readonly children: ReactNode }) {
  const [enabled, setEnabled] = useState<boolean>(DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED);
  const [mounted, setMounted] = useState(false);
  const [accountSyncState, setAccountSyncState] = useState<SampleReviewsOnOverviewAccountSyncState>("idle");

  useEffect(() => {
    setEnabled(readSampleReviewsOnOverviewEnabledFromStorage());
    setMounted(true);

    void syncSampleReviewsOnOverviewEnabledFromServer().then((syncedEnabled) => {
      if (syncedEnabled === null) {
        return;
      }

      setEnabled(syncedEnabled);
      setAccountSyncState("synced");
    });
  }, []);

  const setAndPersist = useCallback((nextEnabled: boolean) => {
    setEnabled(nextEnabled);
    void persistSampleReviewsOnOverviewEnabled(nextEnabled).then((synced) => {
      setAccountSyncState(synced ? "synced" : "local-only");
    });
  }, []);

  const value = useMemo<SampleReviewsOnOverviewPreferenceContextValue>(
    () => ({
      enabled,
      mounted,
      accountSyncState,
      setAndPersist,
    }),
    [accountSyncState, enabled, mounted, setAndPersist],
  );

  return (
    <SampleReviewsOnOverviewPreferenceContext.Provider value={value}>
      {props.children}
    </SampleReviewsOnOverviewPreferenceContext.Provider>
  );
}

export function useSampleReviewsOnOverviewPreference(): SampleReviewsOnOverviewPreferenceContextValue {
  const context = useContext(SampleReviewsOnOverviewPreferenceContext);

  if (context === null) {
    throw new Error(
      "useSampleReviewsOnOverviewPreference must be used within SampleReviewsOnOverviewPreferenceProvider.",
    );
  }

  return context;
}

/** When no provider is mounted (tests, marketing), sample reviews stay visible. */
export function useSampleReviewsOnOverviewVisible(): boolean {
  const context = useContext(SampleReviewsOnOverviewPreferenceContext);

  if (context === null) {
    return DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED;
  }

  return context.enabled;
}
