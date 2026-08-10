"use client";

import { useEffect, useState } from "react";

import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import {
  ARCHITECTURE_CREATION_PAGE_SUBTITLE,
  ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS,
} from "@/lib/create-vs-review-intake-copy";

/** `/architectures/new` — resume-first page subtitle when browser-local drafts exist (TB-1462). */
export function ArchitecturesNewPageSubtitle(): React.JSX.Element {
  const entries = useArchitectureDraftRegistryEntries();
  const [registryHydrated, setRegistryHydrated] = useState(false);

  useEffect(() => {
    setRegistryHydrated(true);
  }, []);

  if (!registryHydrated) {
    return <>{ARCHITECTURE_CREATION_PAGE_SUBTITLE}</>;
  }

  if (entries.length > 0) {
    return <>{ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS}</>;
  }

  return <>{ARCHITECTURE_CREATION_PAGE_SUBTITLE}</>;
}
