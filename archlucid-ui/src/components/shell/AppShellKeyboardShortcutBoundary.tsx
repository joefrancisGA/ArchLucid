"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { KeyboardShortcutProviderProps } from "@/components/KeyboardShortcutProvider";
import { importDeferredChunkWithRetry } from "@/lib/import-deferred-chunk-with-retry";

/** Loads keyboard shortcuts after first paint so hub routes avoid the dialog bundle on sync import. */
export function AppShellKeyboardShortcutBoundary(
  props: KeyboardShortcutProviderProps,
): React.JSX.Element {
  const [Provider, setProvider] = useState<
    ((boundaryProps: KeyboardShortcutProviderProps) => ReactNode) | null
  >(null);

  useEffect(() => {
    void importDeferredChunkWithRetry(() => import("@/components/KeyboardShortcutProvider")).then((module) => {
      setProvider(() => module.KeyboardShortcutProvider);
    });
  }, []);

  if (Provider === null) {
    return <>{props.children}</>;
  }

  return <Provider onHelpRequested={props.onHelpRequested}>{props.children}</Provider>;
}
