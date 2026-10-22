import { QueryClient } from "@tanstack/react-query";

import { OPERATOR_QUERY_GC_MS, OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

export function createOperatorQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: OPERATOR_QUERY_STALE_MS,
        gcTime: OPERATOR_QUERY_GC_MS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** Browser singleton so hooks and imperative `fetchQuery` share one cache. */
export function getOperatorQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return createOperatorQueryClient();
  }

  if (browserQueryClient === undefined) {
    browserQueryClient = createOperatorQueryClient();
  }

  return browserQueryClient;
}

/** Vitest helper — drop the browser singleton between cases. */
export function resetOperatorQueryClientForTests(): void {
  browserQueryClient = undefined;
}
