"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type HomeRefreshLoader = () => Promise<void>;

type OperatorHomeRefreshContextValue = {
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly requestRefresh: () => void;
  readonly registerRefreshLoader: (loader: HomeRefreshLoader) => () => void;
};

const OperatorHomeRefreshContext = createContext<OperatorHomeRefreshContextValue | undefined>(undefined);

export type OperatorHomeRefreshProviderProps = {
  readonly children: ReactNode;
};

/** Coordinates Overview page-header refresh with home data loaders (runs list, ROI, next-best action). */
export function OperatorHomeRefreshProvider(props: OperatorHomeRefreshProviderProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const loadersRef = useRef<Set<HomeRefreshLoader>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    setLastRefreshedAt(new Date());
  }, []);

  const registerRefreshLoader = useCallback((loader: HomeRefreshLoader) => {
    loadersRef.current.add(loader);

    return () => {
      loadersRef.current.delete(loader);
    };
  }, []);

  const requestRefresh = useCallback(() => {
    setRefreshing(true);

    const loaderPromises = [...loadersRef.current].map((loader) => loader());

    void Promise.all([
      ...loaderPromises,
      queryClient.invalidateQueries({ queryKey: operatorQueryKeys.sponsorRoiSummary }),
      queryClient.invalidateQueries({ queryKey: operatorQueryKeys.corePilotCommitContext }),
      queryClient.refetchQueries({ queryKey: operatorQueryKeys.sponsorRoiSummary }),
      queryClient.refetchQueries({ queryKey: operatorQueryKeys.corePilotCommitContext }),
    ])
      .then(() => {
        setLastRefreshedAt(new Date());
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [queryClient]);

  const value = useMemo<OperatorHomeRefreshContextValue>(
    () => ({
      refreshing,
      lastRefreshedAt,
      requestRefresh,
      registerRefreshLoader,
    }),
    [lastRefreshedAt, refreshing, registerRefreshLoader, requestRefresh],
  );

  return (
    <OperatorHomeRefreshContext.Provider value={value}>{props.children}</OperatorHomeRefreshContext.Provider>
  );
}

export function useOperatorHomeRefresh(): OperatorHomeRefreshContextValue {
  const context = useContext(OperatorHomeRefreshContext);

  if (context === undefined) {
    throw new Error("useOperatorHomeRefresh must be used within OperatorHomeRefreshProvider");
  }

  return context;
}

/** Optional hook for panels that may render outside the home provider in unit tests. */
export function useOptionalOperatorHomeRefresh(): OperatorHomeRefreshContextValue | null {
  return useContext(OperatorHomeRefreshContext) ?? null;
}
