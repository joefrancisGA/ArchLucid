"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type OperatorChromeMode = "full" | "minimal";

type OperatorChromeModeContextValue = {
  mode: OperatorChromeMode;
  setMode: Dispatch<SetStateAction<OperatorChromeMode>>;
};

const OperatorChromeModeContext = createContext<OperatorChromeModeContextValue | null>(null);

export function OperatorChromeModeProvider(props: { readonly children: ReactNode }) {
  const { children } = props;
  const [mode, setMode] = useState<OperatorChromeMode>("full");
  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <OperatorChromeModeContext.Provider value={value}>{children}</OperatorChromeModeContext.Provider>;
}

export function useOperatorChromeMode(): OperatorChromeMode {
  const ctx = useContext(OperatorChromeModeContext);

  return ctx?.mode ?? "full";
}

/** Safe no-op when used outside provider (should not happen under `AppShellClient`). */
export function useSetOperatorChromeMode(): (next: OperatorChromeMode) => void {
  const ctx = useContext(OperatorChromeModeContext);

  return useCallback(
    (next: OperatorChromeMode) => {
      if (ctx !== null) {
        ctx.setMode(next);
      }
    },
    [ctx],
  );
}
