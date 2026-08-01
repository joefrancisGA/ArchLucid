"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import type { AlertRulesHubTabId } from "@/lib/alerts-hub-tab";

type TabLoader = () => Promise<void>;

type AlertRulesHubRefreshContextValue = {
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly requestRefresh: () => void;
  readonly registerTabLoader: (tabId: AlertRulesHubTabId, loader: TabLoader) => () => void;
};

const AlertRulesHubRefreshContext = createContext<AlertRulesHubRefreshContextValue | undefined>(undefined);

export type AlertRulesHubRefreshProviderProps = {
  readonly activeTab: AlertRulesHubTabId;
  readonly children: ReactNode;
};

/** Coordinates page-header refresh with the active alert-rules hub tab loader. */
export function AlertRulesHubRefreshProvider(props: AlertRulesHubRefreshProviderProps): React.JSX.Element {
  const loadersRef = useRef<Partial<Record<AlertRulesHubTabId, TabLoader>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const registerTabLoader = useCallback((tabId: AlertRulesHubTabId, loader: TabLoader) => {
    loadersRef.current[tabId] = loader;

    return () => {
      if (loadersRef.current[tabId] === loader) {
        delete loadersRef.current[tabId];
      }
    };
  }, []);

  const requestRefresh = useCallback(() => {
    const loader = loadersRef.current[props.activeTab];

    if (loader === undefined) {
      return;
    }

    setRefreshing(true);

    void loader()
      .then(() => {
        setLastRefreshedAt(new Date());
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [props.activeTab]);

  const value = useMemo<AlertRulesHubRefreshContextValue>(
    () => ({
      refreshing,
      lastRefreshedAt,
      requestRefresh,
      registerTabLoader,
    }),
    [lastRefreshedAt, refreshing, registerTabLoader, requestRefresh],
  );

  return (
    <AlertRulesHubRefreshContext.Provider value={value}>{props.children}</AlertRulesHubRefreshContext.Provider>
  );
}

export function useAlertRulesHubRefresh(): AlertRulesHubRefreshContextValue {
  const context = useContext(AlertRulesHubRefreshContext);

  if (context === undefined) {
    throw new Error("useAlertRulesHubRefresh must be used within AlertRulesHubRefreshProvider");
  }

  return context;
}

/** Optional hook for tab panels that may render outside the hub provider in unit tests. */
export function useOptionalAlertRulesHubRefresh(): AlertRulesHubRefreshContextValue | null {
  return useContext(AlertRulesHubRefreshContext) ?? null;
}
