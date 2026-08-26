import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";

import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

type OperatorQueryHookOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "staleTime" | "gcTime" | "retry"
> & {
  readonly staleTime?: number;
  readonly gcTime?: number;
  readonly retry?: boolean | number;
};

/** Applies standard operator-shell cache defaults to a TanStack Query hook. */
export function useOperatorQueryHook<TData>(
  options: OperatorQueryHookOptions<TData>,
): UseQueryResult<TData, Error> {
  const {
    staleTime = OPERATOR_QUERY_STALE_MS,
    gcTime = OPERATOR_QUERY_GC_MS,
    retry = false,
    ...queryOptions
  } = options;

  return useQuery<TData, Error>({
    staleTime,
    gcTime,
    retry,
    ...queryOptions,
  });
}
