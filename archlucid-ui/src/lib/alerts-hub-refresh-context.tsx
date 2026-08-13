"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { AlertRulesHubTabId } from "@/lib/alerts-hub-tab";
import type { AlertRulesConfigChange } from "@/lib/alert-rules-config-change";

type TabLoader = () => Promise<void>;

const INITIAL_TAB_COUNTS: Record<AlertRulesHubTabId, number> = {
  rules: 0,
  notifications: 0,
  "advanced-rules": 0,
  "test-alerts": 0,
};

type AlertRulesHubRefreshContextValue = {
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly tabCounts: Partial<Record<AlertRulesHubTabId, number>>;
  readonly rulesConfigChange: AlertRulesConfigChange | null;
  readonly requestRefresh: () => void;
  readonly reportTabLoaded: (
    tabId: AlertRulesHubTabId,
    itemCount?: number,
    rulesConfigChange?: AlertRulesConfigChange | null,
  ) => void;
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
  const [tabCounts, setTabCounts] = useState<Partial<Record<AlertRulesHubTabId, number>>>(INITIAL_TAB_COUNTS);
  const [rulesConfigChange, setRulesConfigChange] = useState<AlertRulesConfigChange | null>(null);

  // Freshness is per active tab — clear when the operator switches so the header does not
  // show another tab's stamp.
  useEffect(() => {
    setLastRefreshedAt(null);
  }, [props.activeTab]);

  const registerTabLoader = useCallback((tabId: AlertRulesHubTabId, loader: TabLoader) => {
    loadersRef.current[tabId] = loader;

    return () => {
      if (loadersRef.current[tabId] === loader) {
        delete loadersRef.current[tabId];
      }
    };
  }, []);

  const reportTabLoaded = useCallback(
    (
      tabId: AlertRulesHubTabId,
      itemCount?: number,
      nextRulesConfigChange?: AlertRulesConfigChange | null,
    ) => {
      if (itemCount !== undefined) {
        setTabCounts((current) => {
          const next = { ...current, [tabId]: itemCount };

          if (tabId === "rules") {
            next["test-alerts"] = itemCount;
          }

          return next;
        });
      }

      if (tabId === "rules" && nextRulesConfigChange !== undefined) {
        setRulesConfigChange(nextRulesConfigChange);
      }

      if (tabId !== props.activeTab) {
        return;
      }

      setLastRefreshedAt(new Date());
    },
    [props.activeTab],
  );

  const requestRefresh = useCallback(() => {
    const loader = loadersRef.current[props.activeTab];

    if (loader === undefined) {
      return;
    }

    setRefreshing(true);

    void loader()
      .then(() => {
        reportTabLoaded(props.activeTab);
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [props.activeTab, reportTabLoaded]);

  const value = useMemo<AlertRulesHubRefreshContextValue>(
    () => ({
      refreshing,
      lastRefreshedAt,
      tabCounts,
      rulesConfigChange,
      requestRefresh,
      reportTabLoaded,
      registerTabLoader,
    }),
    [
      lastRefreshedAt,
      refreshing,
      registerTabLoader,
      reportTabLoaded,
      requestRefresh,
      rulesConfigChange,
      tabCounts,
    ],
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
