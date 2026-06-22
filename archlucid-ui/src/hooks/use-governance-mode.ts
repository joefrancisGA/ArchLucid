"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  readGovernanceModeEnabledFromStorage,
  writeGovernanceModeEnabledToStorage,
} from "@/lib/governance-mode-storage";
import { governanceModeVocabulary, type GovernanceModeVocabulary } from "@/lib/governance-mode-vocabulary";

type GovernanceModeContextValue = {
  mounted: boolean;
  isGovernanceModeEnabled: boolean;
  setGovernanceModeEnabled: Dispatch<SetStateAction<boolean>>;
  vocabulary: GovernanceModeVocabulary;
};

const GovernanceModeContext = createContext<GovernanceModeContextValue | null>(null);

export function GovernanceModeProvider(props: { readonly children: ReactNode }) {
  const { children } = props;
  const [mounted, setMounted] = useState(false);
  const [isGovernanceModeEnabled, setGovernanceModeEnabledState] = useState(false);

  useEffect(() => {
    setGovernanceModeEnabledState(readGovernanceModeEnabledFromStorage());
    setMounted(true);
  }, []);

  const setGovernanceModeEnabled = useCallback<Dispatch<SetStateAction<boolean>>>((next) => {
    setGovernanceModeEnabledState((previous) => {
      const resolved = typeof next === "function" ? next(previous) : next;

      writeGovernanceModeEnabledToStorage(resolved);

      return resolved;
    });
  }, []);

  const vocabulary = useMemo(
    () => governanceModeVocabulary(isGovernanceModeEnabled),
    [isGovernanceModeEnabled],
  );

  const value = useMemo(
    () => ({
      mounted,
      isGovernanceModeEnabled,
      setGovernanceModeEnabled,
      vocabulary,
    }),
    [mounted, isGovernanceModeEnabled, setGovernanceModeEnabled, vocabulary],
  );

  return <GovernanceModeContext.Provider value={value}>{children}</GovernanceModeContext.Provider>;
}

export function useGovernanceMode(): GovernanceModeContextValue {
  const context = useContext(GovernanceModeContext);

  if (context === null) {
    return {
      mounted: false,
      isGovernanceModeEnabled: false,
      setGovernanceModeEnabled: () => undefined,
      vocabulary: governanceModeVocabulary(false),
    };
  }

  return context;
}
