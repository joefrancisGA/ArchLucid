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
  type WorkingCareerRehearsalIntentId,
} from "@/lib/governance/working-career-rehearsal-intent";
import {
  readWorkingCareerRehearsalIntentFromStorage,
  resolveInitialWorkingCareerRehearsalIntent,
  writeWorkingCareerRehearsalIntentToStorage,
} from "@/lib/governance/working-career-rehearsal-preference";

type WorkingCareerRehearsalIntentContextValue = {
  readonly intent: WorkingCareerRehearsalIntentId;
  readonly mounted: boolean;
  readonly setIntent: (intent: WorkingCareerRehearsalIntentId) => void;
};

const WorkingCareerRehearsalIntentContext =
  createContext<WorkingCareerRehearsalIntentContextValue | null>(null);

/** AS-077: Working-only Career vs Rehearsal product chrome (not host AgentExecution:Mode). */
export function WorkingCareerRehearsalIntentProvider(props: { readonly children: ReactNode }) {
  const [intent, setIntentState] = useState<WorkingCareerRehearsalIntentId>("career");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readWorkingCareerRehearsalIntentFromStorage();

    setIntentState(
      resolveInitialWorkingCareerRehearsalIntent({
        storedIntent: stored,
        hasStoredPreference: typeof window !== "undefined"
          && window.localStorage.getItem("archlucid.workingCareerRehearsalIntent.v1") !== null,
      }),
    );
    setMounted(true);
  }, []);

  const setIntent = useCallback((nextIntent: WorkingCareerRehearsalIntentId) => {
    setIntentState(nextIntent);
    writeWorkingCareerRehearsalIntentToStorage(nextIntent);
  }, []);

  const value = useMemo<WorkingCareerRehearsalIntentContextValue>(
    () => ({
      intent,
      mounted,
      setIntent,
    }),
    [intent, mounted, setIntent],
  );

  return (
    <WorkingCareerRehearsalIntentContext.Provider value={value}>
      {props.children}
    </WorkingCareerRehearsalIntentContext.Provider>
  );
}

export function useWorkingCareerRehearsalIntent(): WorkingCareerRehearsalIntentContextValue {
  const context = useContext(WorkingCareerRehearsalIntentContext);

  if (context === null) {
    throw new Error("useWorkingCareerRehearsalIntent must be used within WorkingCareerRehearsalIntentProvider.");
  }

  return context;
}
