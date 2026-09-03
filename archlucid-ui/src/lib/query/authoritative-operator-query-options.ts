/** TanStack Query overrides for surfaces where stale authority state is costly (review workspace). */
export const AUTHORITATIVE_OPERATOR_STALE_MS = 30_000;

export const AUTHORITATIVE_OPERATOR_REFETCH_INTERVAL_MS = 120_000;

export const AUTHORITATIVE_OPERATOR_QUERY_OPTIONS = {
  staleTime: AUTHORITATIVE_OPERATOR_STALE_MS,
  refetchOnWindowFocus: true,
  refetchInterval: AUTHORITATIVE_OPERATOR_REFETCH_INTERVAL_MS,
  refetchIntervalInBackground: false,
} as const;
