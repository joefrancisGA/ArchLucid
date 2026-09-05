"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { FindingCardShortcutDisposition } from "@/hooks/useFindingCardShortcuts";

export type FindingKeyboardTriageContextValue = {
  readonly requestDisposition: (findingId: string, disposition: FindingCardShortcutDisposition) => void;
  readonly isDispositionBlocked: (findingId: string) => string | null;
  readonly mutationsEnabled: boolean;
};

const FindingKeyboardTriageContext = createContext<FindingKeyboardTriageContextValue | null>(null);

export type FindingKeyboardTriageProviderProps = {
  readonly children: ReactNode;
  readonly value: FindingKeyboardTriageContextValue;
};

export function FindingKeyboardTriageProvider(props: FindingKeyboardTriageProviderProps): React.JSX.Element {
  return (
    <FindingKeyboardTriageContext.Provider value={props.value}>
      {props.children}
    </FindingKeyboardTriageContext.Provider>
  );
}

export function useFindingKeyboardTriage(): FindingKeyboardTriageContextValue | null {
  return useContext(FindingKeyboardTriageContext);
}
