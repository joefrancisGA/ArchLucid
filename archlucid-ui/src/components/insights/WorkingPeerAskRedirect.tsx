"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { resolveSystemNotJobWorkingPeerAskRedirectHref } from "@/lib/system-not-job-ask-bound-to-open-package";

/** Working peer Ask → nested Ask redirect (ADR 0079 / SY-37 / SN-024). */
export function WorkingPeerAskRedirect(): null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();

  useEffect(() => {
    if (!workspaceMounted || !isWorkingMode) {
      return;
    }

    const search = searchParams.toString();
    const redirectHref = resolveSystemNotJobWorkingPeerAskRedirectHref({
      pathname,
      search: search.length > 0 ? `?${search}` : "",
      lastOpenArchitectureId: readCachedLastOpenArchitectureId(),
      queryArchitectureId: searchParams.get("architectureId"),
    });

    if (redirectHref === null) {
      return;
    }

    const currentPath = `${pathname}${search.length > 0 ? `?${search}` : ""}`;

    if (currentPath === redirectHref) {
      return;
    }

    router.replace(redirectHref, { scroll: false });
  }, [pathname, router, searchParams, workspaceMounted, isWorkingMode]);

  return null;
}
