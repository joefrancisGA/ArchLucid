"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { resolveSystemNotJobWorkingPeerSearchRedirectHref } from "@/lib/system-not-job-search-bound-to-open-package";

/** Working peer Search → nested search redirect (ADR 0079 / SY-42 / SN-026). */
export function WorkingPeerSearchRedirect(): null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();

  useEffect(() => {
    if (!workspaceMounted || !isWorkingMode) {
      return;
    }

    const search = searchParams.toString();
    const redirectHref = resolveSystemNotJobWorkingPeerSearchRedirectHref({
      pathname,
      search: search.length > 0 ? `?${search}` : "",
      lastOpenArchitectureId: readCachedLastOpenArchitectureId(),
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
