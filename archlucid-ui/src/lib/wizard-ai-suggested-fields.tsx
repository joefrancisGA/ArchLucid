"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type WizardAiSuggestedFieldName =
  | "constraints"
  | "requiredCapabilities"
  | "assumptions"
  | "topologyHints"
  | "securityBaselineHints";

function chipKey(field: WizardAiSuggestedFieldName, value: string): string {
  return `${field}:${value.trim().toLowerCase()}`;
}

type WizardAiSuggestedFieldsContextValue = {
  isAiSuggested: (field: WizardAiSuggestedFieldName, value: string) => boolean;
  markAiSuggested: (field: WizardAiSuggestedFieldName, values: readonly string[]) => void;
  clearAiSuggested: (field: WizardAiSuggestedFieldName, value: string) => void;
};

const WizardAiSuggestedFieldsContext = createContext<WizardAiSuggestedFieldsContextValue | null>(null);

const noopContext: WizardAiSuggestedFieldsContextValue = {
  isAiSuggested: () => false,
  markAiSuggested: () => {},
  clearAiSuggested: () => {},
};

/** Tracks wizard chip values pre-filled by POST /v1/architecture/request/draft until the operator edits them. */
export function WizardAiSuggestedFieldsProvider(props: { readonly children: ReactNode }) {
  const [keys, setKeys] = useState<ReadonlySet<string>>(() => new Set());

  const markAiSuggested = useCallback((field: WizardAiSuggestedFieldName, values: readonly string[]) => {
    setKeys((prev) => {
      const next = new Set(prev);

      for (const value of values) {
        const trimmed = value.trim();

        if (trimmed.length > 0) {
          next.add(chipKey(field, trimmed));
        }
      }

      return next;
    });
  }, []);

  const clearAiSuggested = useCallback((field: WizardAiSuggestedFieldName, value: string) => {
    setKeys((prev) => {
      const key = chipKey(field, value);

      if (!prev.has(key)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(key);

      return next;
    });
  }, []);

  const isAiSuggested = useCallback(
    (field: WizardAiSuggestedFieldName, value: string) => keys.has(chipKey(field, value)),
    [keys],
  );

  const value = useMemo(
    () => ({
      isAiSuggested,
      markAiSuggested,
      clearAiSuggested,
    }),
    [clearAiSuggested, isAiSuggested, markAiSuggested],
  );

  return (
    <WizardAiSuggestedFieldsContext.Provider value={value}>{props.children}</WizardAiSuggestedFieldsContext.Provider>
  );
}

export function useWizardAiSuggestedFields(): WizardAiSuggestedFieldsContextValue {
  const context = useContext(WizardAiSuggestedFieldsContext);

  if (context === null) {
    return noopContext;
  }

  return context;
}
