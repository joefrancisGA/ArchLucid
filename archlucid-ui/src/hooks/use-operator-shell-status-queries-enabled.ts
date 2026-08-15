"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { useDeferredOperatorShellStatusQueriesEnabled } from "@/hooks/use-deferred-operator-shell-status-queries-enabled";
import { shouldFetchOperatorShellStatusOnRoute } from "@/lib/operator/operator-shell-status-route-policy";

/** Idle-deferred and route-aware gate for Tier-1 operator shell status queries. */
export function useOperatorShellStatusQueriesEnabled(): boolean {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deferredReady = useDeferredOperatorShellStatusQueriesEnabled();

  return deferredReady && shouldFetchOperatorShellStatusOnRoute(pathname, searchParams);
}
