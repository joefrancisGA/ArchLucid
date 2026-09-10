"use client";

import { useMemo } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { resolveAuditTrailReviewHref } from "@/lib/resolve-audit-trail-review-href";

export function useAuditTrailReviewHref(
  runId: string,
  architectureId?: string | null,
): string {
  const { isWorkingMode } = useWorkspaceMode();
  const draftRegistryEntries = useArchitectureDraftRegistryEntries();

  return useMemo(
    () =>
      resolveAuditTrailReviewHref({
        workingMode: isWorkingMode,
        runId,
        architectureId,
        draftRegistryEntries,
      }),
    [architectureId, draftRegistryEntries, isWorkingMode, runId],
  );
}
