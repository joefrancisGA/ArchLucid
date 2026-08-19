"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { resolveOperatorShellAuditRunId } from "@/lib/resolve-operator-shell-audit-run-id";

/** Review id for scoping audit nav links in the current operator shell session. */
export function useOperatorShellAuditRunId(): string | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceRun = useWorkspaceActiveRun();

  return useMemo(() => {
    return resolveOperatorShellAuditRunId({
      pathname: pathname ?? "/",
      search: searchParams?.toString() ?? "",
      workspaceActiveRunId: workspaceRun?.activeRunId ?? null,
    });
  }, [pathname, searchParams, workspaceRun?.activeRunId]);
}
