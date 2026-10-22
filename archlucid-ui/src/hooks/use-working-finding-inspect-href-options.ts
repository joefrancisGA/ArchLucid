"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { resolveWorkingFindingInspectHrefOptions } from "@/lib/inhabit/resolve-working-finding-inspect-href-options";

/** WA-002 — inspect options for Working specialist finding deep-links. */
export function useWorkingFindingInspectHrefOptions(
  scopedArchitectureId?: string | null,
) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const { isWorkingMode, mounted } = useWorkspaceMode();
  const queryArchitectureId = searchParams.get("architectureId");

  return useMemo(
    () =>
      resolveWorkingFindingInspectHrefOptions({
        workingMode: mounted && isWorkingMode,
        pathname,
        scopedArchitectureId: scopedArchitectureId ?? queryArchitectureId,
      }),
    [isWorkingMode, mounted, pathname, queryArchitectureId, scopedArchitectureId],
  );
}
