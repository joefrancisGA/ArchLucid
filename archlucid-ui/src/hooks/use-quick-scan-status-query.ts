"use client";

import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { QuickScanStatusResponse } from "@/lib/quick-scan/quick-scan-types";

async function fetchQuickScanStatus(): Promise<QuickScanStatusResponse | null> {
  const response = await fetch("/api/proxy/v1/marketing/quick-scan/status", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as QuickScanStatusResponse;
}

export function useQuickScanStatusQuery() {
  return useOperatorQueryHook<QuickScanStatusResponse | null>({
    queryKey: operatorQueryKeys.quickScanStatus,
    queryFn: fetchQuickScanStatus,
    retry: false,
  });
}
