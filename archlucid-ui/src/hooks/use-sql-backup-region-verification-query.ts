"use client";

import { useQuery } from "@tanstack/react-query";

import { isBrowser } from "@/lib/api/http";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import {
  fetchSqlBackupRegionVerification,
  type SqlBackupRegionVerification,
} from "@/lib/sql-backup-region-verification";

export function useSqlBackupRegionVerificationQuery() {
  return useQuery<SqlBackupRegionVerification>({
    queryKey: operatorQueryKeys.sqlBackupRegionVerification,
    queryFn: fetchSqlBackupRegionVerification,
    enabled: isBrowser(),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
