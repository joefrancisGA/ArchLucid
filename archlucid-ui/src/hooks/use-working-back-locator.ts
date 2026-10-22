"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import {
  resolveWorkingBackLocator,
  type ResolveWorkingBackLocatorInput,
  type WorkingBackLocator,
} from "@/lib/architecture/working-back-href";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";

export function useWorkingBackLocator(
  input: Omit<ResolveWorkingBackLocatorInput, "pathname" | "draftRegistryEntries">,
): WorkingBackLocator {
  const pathname = usePathname();
  const draftRegistryEntries = useArchitectureDraftRegistryEntries();

  return useMemo(
    () =>
      resolveWorkingBackLocator({
        ...input,
        pathname,
        draftRegistryEntries,
      }),
    [draftRegistryEntries, input.architectureId, input.reviewId, input.reviewTab, pathname],
  );
}
