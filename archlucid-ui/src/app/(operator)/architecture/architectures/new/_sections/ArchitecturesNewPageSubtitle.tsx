"use client";

import { useEffect, useState } from "react";

import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { architecturesNewPageSubtitle } from "@/lib/architectures-new-page-copy";

/** `/architectures/new` — resume-first page subtitle when browser-local drafts exist (TB-1462). */
export function ArchitecturesNewPageSubtitle(): React.JSX.Element {
  const entries = useArchitectureDraftRegistryEntries();
  const [registryHydrated, setRegistryHydrated] = useState(false);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  useEffect(() => {
    setRegistryHydrated(true);
  }, []);

  if (!registryHydrated) {
    return <>{architecturesNewPageSubtitle(buyerPolishedShell, false)}</>;
  }

  return <>{architecturesNewPageSubtitle(buyerPolishedShell, entries.length > 0)}</>;
}
