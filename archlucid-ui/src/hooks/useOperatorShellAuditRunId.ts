"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { resolveOperatorShellAuditRunId } from "@/lib/resolve-operator-shell-audit-run-id";

/** Review id for scoping audit nav links in the current operator shell session. */
export function useOperatorShellAuditRunId(): string | null {
  const pathname = usePathname();
  const workspaceRun = useWorkspaceActiveRun();
  const [search, setSearch] = useState(() => readWindowLocationSearch());

  useEffect(() => {
    const syncSearchFromUrl = (): void => {
      const nextSearch = readWindowLocationSearch();

      setSearch((current) => (current === nextSearch ? current : nextSearch));
    };

    syncSearchFromUrl();
    window.addEventListener("popstate", syncSearchFromUrl);

    return () => {
      window.removeEventListener("popstate", syncSearchFromUrl);
    };
  }, []);

  return useMemo(() => {
    return resolveOperatorShellAuditRunId({
      pathname: pathname ?? "/",
      search,
      workspaceActiveRunId: workspaceRun?.activeRunId ?? null,
    });
  }, [pathname, search, workspaceRun?.activeRunId]);
}
