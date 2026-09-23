"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useSessionAiReadinessCore,
  type SessionAiReadinessOptions,
  type SessionAiReadinessState,
} from "@/hooks/use-session-ai-readiness-core";

const SessionAiReadinessContext = createContext<SessionAiReadinessState | null>(null);

/** Shares one live AI availability probe across operator shell surfaces (banner, top-bar chip). */
export function SessionAiReadinessProvider(props: { readonly children: ReactNode }): React.JSX.Element {
  const value = useSessionAiReadinessCore();

  return (
    <SessionAiReadinessContext.Provider value={value}>
      {props.children}
    </SessionAiReadinessContext.Provider>
  );
}

/**
 * Session-effective Real mode readiness. Uses shell provider state when present;
 * review failure recovery passes `requireLiveProbe` to run an isolated probe instance.
 */
export function useSessionAiReadiness(options?: SessionAiReadinessOptions): SessionAiReadinessState {
  const requireLiveProbe = options?.requireLiveProbe === true;
  const context = useContext(SessionAiReadinessContext);
  const optsProvided = options !== undefined;
  const useProviderState = optsProvided && !requireLiveProbe && context !== null;
  // When callers pass options (review failure recovery), always run the isolated core so
  // toggling requireLiveProbe cannot change hook order between renders. Suppress duplicate
  // probe churn when the shell provider already owns live readiness state.
  const isolated = useSessionAiReadinessCore(
    optsProvided
      ? {
          ...options,
          probeSuppressed: useProviderState,
        }
      : undefined,
  );

  if (optsProvided) {
    if (useProviderState) {
      return context;
    }

    return isolated;
  }

  if (context !== null) {
    return context;
  }

  return isolated;
}
