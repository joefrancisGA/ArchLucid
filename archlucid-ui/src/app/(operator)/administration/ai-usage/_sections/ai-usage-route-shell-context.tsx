"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AiUsageRouteShellState = {
  readonly isQuietEmptyPeriod: boolean;
  readonly setQuietEmptyPeriod: (value: boolean) => void;
};

const AiUsageRouteShellContext = createContext<AiUsageRouteShellState | null>(null);

export function AiUsageRouteShellProvider(props: { readonly children: ReactNode }) {
  const [isQuietEmptyPeriod, setQuietEmptyPeriod] = useState(false);
  const value = useMemo(
    () => ({
      isQuietEmptyPeriod,
      setQuietEmptyPeriod,
    }),
    [isQuietEmptyPeriod],
  );

  return (
    <AiUsageRouteShellContext.Provider value={value}>
      {props.children}
    </AiUsageRouteShellContext.Provider>
  );
}

export function useAiUsageRouteShellState(): AiUsageRouteShellState | null {
  return useContext(AiUsageRouteShellContext);
}
