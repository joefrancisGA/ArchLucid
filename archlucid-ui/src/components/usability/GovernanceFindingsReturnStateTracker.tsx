"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { persistGovernanceFindingsReturnHref } from "@/lib/governance/governance-findings-return-state";
import { isFindingsRoutePath } from "@/lib/product-line/securenow-compliance-routes";

/** Persists the current governance findings queue URL (including query filters) for continue navigation. */
export function GovernanceFindingsReturnStateTracker() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  useEffect(() => {
    if (
      !isFindingsRoutePath(pathname)
      && !/^\/architecture\/architectures\/[^/]+\/findings(\/|$)/.test(pathname)
    ) {
      return;
    }

    const query = searchParams.toString();
    const href = query.length > 0 ? `${pathname}?${query}` : pathname;

    persistGovernanceFindingsReturnHref(href);
  }, [pathname, searchParams]);

  return null;
}
