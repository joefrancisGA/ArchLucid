"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { persistGovernanceFindingsReturnHref } from "@/lib/governance/governance-findings-return-state";

/** Persists the current governance findings queue URL (including query filters) for continue navigation. */
export function GovernanceFindingsReturnStateTracker() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname.startsWith("/governance/findings")) {
      return;
    }

    const query = searchParams.toString();
    const href = query.length > 0 ? `${pathname}?${query}` : pathname;

    persistGovernanceFindingsReturnHref(href);
  }, [pathname, searchParams]);

  return null;
}
